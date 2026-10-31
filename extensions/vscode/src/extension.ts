/**
 * AgentShield-X VS Code Extension Entrypoint (Feature #22)
 * Architect: Tharunkumar.S | AgentShield-X Security Labs
 */

import * as vscode from 'vscode';
import * as http from 'http';

let diagnosticCollection: vscode.DiagnosticCollection;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('[AgentShield-X] Extension activated in VS Code.');

  diagnosticCollection = vscode.languages.createDiagnosticCollection('agentshield');
  context.subscriptions.push(diagnosticCollection);

  // Status Bar Integration
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'agentshield.openConsole';
  statusBarItem.text = `$(shield) AgentShield: Active`;
  statusBarItem.tooltip = 'AgentShield-X: Sub-millisecond Agentic Defense Online';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('agentshield.openConsole', () => {
      vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000'));
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('agentshield.scanWorkspace', async () => {
      vscode.window.showInformationMessage('AgentShield-X: Scanning workspace for agent security antipatterns...');
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await lintDocument(editor.document);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('agentshield.insertHoneytool', async () => {
      const toolType = await vscode.window.showQuickPick(
        ['sql_database', 'corporate_email', 'shell_executor', 'aws_s3_storage'],
        { placeHolder: 'Select dynamic canary honeytool type to inject' }
      );
      if (!toolType) return;

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('AgentShield-X: Open a code file to insert honeytool.');
        return;
      }

      const isPython = editor.document.languageId === 'python';
      const snippet = isPython
        ? `\n# --- AgentShield-X Canary Honeytool Trap ---\nfrom shield_core.honeytools import DynamicHoneytoolFactory\n\n@DynamicHoneytoolFactory.register(name="query_${toolType}_admin", canary_token="AS-CANARY-GEN")\ndef query_${toolType}_admin(query: str) -> str:\n    raise PermissionError("Security Violation: Canary honeytool triggered.")\n`
        : `\n// --- AgentShield-X Canary Honeytool Trap ---\nimport { registerCanaryTool } from "@agentshield/sdk";\n\nexport const query_${toolType}_admin = registerCanaryTool({\n  name: "query_${toolType}_admin",\n  canaryToken: "AS-CANARY-GEN",\n  handler: async () => { throw new Error("Canary honeytool tripped."); }\n});\n`;

      editor.edit((editBuilder) => {
        const position = editor.selection.active;
        editBuilder.insert(position, snippet);
      });
      vscode.window.showInformationMessage(`AgentShield-X: Injected canary honeytool 'query_${toolType}_admin'!`);
    })
  );

  // Event Listeners for Document Changes & Save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      const config = vscode.workspace.getConfiguration('agentshield');
      if (config.get<boolean>('autoLintOnSave', true)) {
        lintDocument(doc);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      lintDocument(doc);
    })
  );

  if (vscode.window.activeTextEditor) {
    lintDocument(vscode.window.activeTextEditor.document);
  }
}

async function lintDocument(document: vscode.TextDocument) {
  const supported = ['python', 'typescript', 'javascript', 'json', 'yaml'];
  if (!supported.includes(document.languageId)) {
    return;
  }

  const content = document.getText();
  const filePath = document.fileName;
  const config = vscode.workspace.getConfiguration('agentshield');
  const apiEndpoint = config.get<string>('apiEndpoint', 'http://127.0.0.1:8002');

  try {
    const postData = JSON.stringify({ file_path: filePath, content: content });
    const url = new URL(`${apiEndpoint}/v1/ide/lint`);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(body);
          updateDiagnostics(document, result.diagnostics || []);
        }
      });
    });

    req.on('error', () => {
      // Offline fallback: regex pre-check
      localFallbackLint(document);
    });

    req.write(postData);
    req.end();
  } catch (err) {
    localFallbackLint(document);
  }
}

function updateDiagnostics(document: vscode.TextDocument, diagnosticsList: any[]) {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const item of diagnosticsList) {
    const line = Math.max(0, item.line - 1);
    const col = Math.max(0, item.column - 1);
    const endCol = Math.max(col + 1, item.end_column);
    const range = new vscode.Range(line, col, line, endCol);

    const severity =
      item.severity === 'ERROR'
        ? vscode.DiagnosticSeverity.Error
        : item.severity === 'WARNING'
        ? vscode.DiagnosticSeverity.Warning
        : vscode.DiagnosticSeverity.Information;

    const diag = new vscode.Diagnostic(range, `[AgentShield-X ${item.rule_id}] ${item.message}`, severity);
    diag.source = 'AgentShield-X';
    diag.code = item.rule_id;
    diagnostics.push(diag);
  }

  diagnosticCollection.set(document.uri, diagnostics);
}

function localFallbackLint(document: vscode.TextDocument) {
  const text = document.getText();
  const diagnostics: vscode.Diagnostic[] = [];
  const lines = text.split('\n');

  lines.forEach((lineText, idx) => {
    if (/os\.system|subprocess\.(Popen|run)/.test(lineText)) {
      const range = new vscode.Range(idx, 0, idx, lineText.length);
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          '[AgentShield-X AS-IDE-001] Arbitrary shell execution inside agent tool. Wrap with Ephemeral Sandbox.',
          vscode.DiagnosticSeverity.Error
        )
      );
    }
  });

  diagnosticCollection.set(document.uri, diagnostics);
}

export function deactivate() {
  if (diagnosticCollection) {
    diagnosticCollection.clear();
  }
}

