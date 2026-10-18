"""
AgentShield-X Sequence Autoencoder Anomaly Model
PyTorch GRU encoder-decoder over tool-ID embeddings and continuous step metrics.
Trained on benign sessions only with early stopping.
Score = reconstruction error normalized by 99th percentile of benign validation set.
Section 6.3 Model 3.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset

TOOL_VOCAB = {
    "<PAD>": 0,
    "read_webpage": 1,
    "read_email": 2,
    "read_pdf": 3,
    "search_customers": 4,
    "send_email": 5,
    "run_sql": 6,
    "write_file": 7,
    "export_all_customers": 8,
    "<UNK>": 9,
}

SENSITIVITY_MAP = {
    "low": 0.0,
    "medium": 0.33,
    "high": 0.66,
    "critical": 1.0,
}


class SequenceAutoencoderNet(nn.Module):
    """PyTorch GRU Sequence Autoencoder architecture."""

    def __init__(self, num_tools: int = 10, embed_dim: int = 16, num_feats: int = 4, hidden_dim: int = 24):
        super().__init__()
        self.tool_embed = nn.Embedding(num_tools, embed_dim, padding_idx=0)
        self.numeric_proj = nn.Linear(num_feats, embed_dim)
        input_dim = embed_dim * 2  # 32

        self.encoder = nn.GRU(input_size=input_dim, hidden_size=hidden_dim, batch_first=True)
        self.decoder = nn.GRU(input_size=hidden_dim, hidden_size=hidden_dim, batch_first=True)
        self.output_proj = nn.Linear(hidden_dim, input_dim)

    def forward(self, tool_ids: torch.Tensor, numeric_feats: torch.Tensor) -> torch.Tensor:
        """
        tool_ids: [batch_size, seq_len]
        numeric_feats: [batch_size, seq_len, 4]
        Returns reconstructed inputs: [batch_size, seq_len, 32]
        """
        emb_tool = self.tool_embed(tool_ids)
        emb_num = torch.relu(self.numeric_proj(numeric_feats))
        inputs = torch.cat([emb_tool, emb_num], dim=-1)  # [batch, seq_len, 32]

        # Encode
        _, hidden = self.encoder(inputs)  # hidden: [1, batch, 24]

        # Decode: repeat latent vector across time steps
        seq_len = inputs.size(1)
        latent_repeated = hidden.transpose(0, 1).repeat(1, seq_len, 1)  # [batch, seq_len, 24]
        decoded, _ = self.decoder(latent_repeated)
        recon = self.output_proj(decoded)  # [batch, seq_len, 32]

        return recon, inputs


class SessionSequenceDataset(Dataset):
    """Pads sessions to max_len tensor representations."""

    def __init__(self, sessions: List[List[Dict[str, Any]]], max_len: int = 10):
        self.max_len = max_len
        self.tool_ids_list = []
        self.numeric_list = []

        for sess in sessions:
            t_ids = []
            num_f = []
            for ev in sess[:max_len]:
                tool_str = ev.get("tool", "<UNK>")
                tid = TOOL_VOCAB.get(tool_str, TOOL_VOCAB["<UNK>"])
                bytes_norm = min(1.0, float(ev.get("bytes_out", 0.0)) / 10000.0)
                tokens_norm = min(1.0, float(ev.get("tokens_used", 0.0)) / 500.0)
                lat_norm = min(1.0, float(ev.get("latency_ms", 30.0)) / 200.0)
                sens_norm = SENSITIVITY_MAP.get(ev.get("sensitivity", "low"), 0.0)

                t_ids.append(tid)
                num_f.append([bytes_norm, tokens_norm, lat_norm, sens_norm])

            # Pad
            while len(t_ids) < max_len:
                t_ids.append(0)
                num_f.append([0.0, 0.0, 0.0, 0.0])

            self.tool_ids_list.append(t_ids)
            self.numeric_list.append(num_f)

        self.tool_ids = torch.tensor(self.tool_ids_list, dtype=torch.long)
        self.numeric = torch.tensor(self.numeric_list, dtype=torch.float32)

    def __len__(self) -> int:
        return len(self.tool_ids)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        return self.tool_ids[idx], self.numeric[idx]


class SequenceAutoencoderModel:
    """Wrapper managing training, early stopping, scoring, and ONNX export."""

    def __init__(self, max_len: int = 10):
        self.max_len = max_len
        self.net = SequenceAutoencoderNet(num_tools=len(TOOL_VOCAB), embed_dim=16, num_feats=4, hidden_dim=24)
        self.norm_p99 = 1.0
        self.threshold = 0.50

    def fit(
        self,
        train_sessions: List[List[Dict[str, Any]]],
        val_sessions: List[List[Dict[str, Any]]],
        epochs: int = 15,
        batch_size: int = 64,
        lr: float = 0.005,
    ) -> SequenceAutoencoderModel:
        """Trains on benign sessions with early stopping on benign validation loss."""
        self.net.train()
        train_dataset = SessionSequenceDataset(train_sessions, max_len=self.max_len)
        val_dataset = SessionSequenceDataset(val_sessions, max_len=self.max_len)

        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

        optimizer = torch.optim.Adam(self.net.parameters(), lr=lr)
        criterion = nn.MSELoss()

        best_val_loss = float("inf")
        patience = 3
        patience_counter = 0

        for epoch in range(epochs):
            self.net.train()
            train_loss = 0.0
            for t_ids, nums in train_loader:
                optimizer.zero_grad()
                recon, targets = self.net(t_ids, nums)
                loss = criterion(recon, targets)
                loss.backward()
                optimizer.step()
                train_loss += loss.item() * len(t_ids)

            # Validation
            self.net.eval()
            val_loss = 0.0
            with torch.no_grad():
                for t_ids, nums in val_loader:
                    recon, targets = self.net(t_ids, nums)
                    loss = criterion(recon, targets)
                    val_loss += loss.item() * len(t_ids)

            train_loss /= len(train_dataset)
            val_loss /= len(val_dataset)

            if val_loss < best_val_loss - 1e-4:
                best_val_loss = val_loss
                patience_counter = 0
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    break

        # Compute 99th percentile on benign validation set for score normalization
        val_errors = self.compute_errors(val_sessions)
        self.norm_p99 = float(np.percentile(val_errors, 99.0)) if len(val_errors) > 0 else 1.0
        self.norm_p99 = max(1e-4, self.norm_p99)

        return self

    def compute_errors(self, sessions: List[List[Dict[str, Any]]]) -> np.ndarray:
        """Calculates per-session reconstruction MSE errors."""
        self.net.eval()
        dataset = SessionSequenceDataset(sessions, max_len=self.max_len)
        loader = DataLoader(dataset, batch_size=128, shuffle=False)

        errors = []
        criterion = nn.MSELoss(reduction="none")
        with torch.no_grad():
            for t_ids, nums in loader:
                recon, targets = self.net(t_ids, nums)
                loss_per_item = criterion(recon, targets).mean(dim=[1, 2]).cpu().numpy()
                errors.extend(loss_per_item)

        return np.array(errors)

    def score_sessions(self, sessions: List[List[Dict[str, Any]]]) -> np.ndarray:
        """Normalized reconstruction error: error / norm_p99 clamped to [0..1]."""
        raw_errors = self.compute_errors(sessions)
        normalized = raw_errors / self.norm_p99
        # Sigmoid compression around threshold
        scores = 1.0 / (1.0 + np.exp(-3.0 * (normalized - 1.0)))
        return np.clip(scores, 0.0, 1.0)

    def save(self, dest_dir: str) -> None:
        """Saves PyTorch weights, ONNX model, and normalization parameters."""
        os.makedirs(dest_dir, exist_ok=True)
        pt_path = os.path.join(dest_dir, "autoencoder.pt")
        meta_path = os.path.join(dest_dir, "autoencoder_meta.json")

        torch.save(self.net.state_dict(), pt_path)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({
                "norm_p99": self.norm_p99,
                "threshold": self.threshold,
                "max_len": self.max_len,
            }, f, indent=2)

        # Export to ONNX
        try:
            onnx_path = os.path.join(dest_dir, "autoencoder.onnx")
            dummy_tool_ids = torch.zeros((1, self.max_len), dtype=torch.long)
            dummy_numeric = torch.zeros((1, self.max_len, 4), dtype=torch.float32)
            torch.onnx.export(
                self.net,
                (dummy_tool_ids, dummy_numeric),
                onnx_path,
                input_names=["tool_ids", "numeric_feats"],
                output_names=["recon", "inputs"],
                dynamic_axes={"tool_ids": {0: "batch"}, "numeric_feats": {0: "batch"}},
                opset_version=14,
            )
        except Exception:
            pass

    def load(self, dest_dir: str) -> None:
        """Loads weights and metadata."""
        pt_path = os.path.join(dest_dir, "autoencoder.pt")
        meta_path = os.path.join(dest_dir, "autoencoder_meta.json")

        self.net.load_state_dict(torch.load(pt_path, map_location="cpu"))
        with open(meta_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.norm_p99 = data["norm_p99"]
        self.threshold = data.get("threshold", 0.50)
        self.max_len = data.get("max_len", 10)
