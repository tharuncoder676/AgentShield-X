"""
AgentShield-X Pydantic Compatibility Layer
Provides full compatibility with Pydantic v2 when installed,
with an autonomous, zero-dependency standard-library fallback (dataclasses)
so AgentShield-X remains resilient and operational even in offline/air-gapped environments.
"""

from __future__ import annotations

import copy
import dataclasses
import json
from typing import Any, Callable, Dict, Optional, Type, TypeVar

T = TypeVar("T", bound="BaseModel")

try:
    from pydantic import BaseModel as _PydanticBaseModel, Field as _PydanticField
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:
    BaseModel = _PydanticBaseModel
    Field = _PydanticField
else:
    def Field(
        default: Any = dataclasses.MISSING,
        default_factory: Optional[Callable[[], Any]] = None,
        description: Optional[str] = None,
        ge: Optional[float] = None,
        le: Optional[float] = None,
        **kwargs: Any,
    ) -> Any:
        if default_factory is not None:
            return dataclasses.field(default_factory=default_factory, metadata={"description": description})
        elif default is not dataclasses.MISSING:
            return dataclasses.field(default=default, metadata={"description": description})
        return dataclasses.field(metadata={"description": description})

    class BaseModel:
        """
        Pure Python fallback for Pydantic v2 BaseModel.
        Enables zero-dependency execution across air-gapped or offline hosts.
        """
        def __init_subclass__(cls, **kwargs):
            super().__init_subclass__(**kwargs)
            dataclasses.dataclass(cls)

        def __init__(self, **data: Any):
            # Fallback initialization if dataclass __init__ needs kwargs mapping
            for k, v in data.items():
                setattr(self, k, v)

        def model_dump(self) -> Dict[str, Any]:
            def _convert(obj: Any) -> Any:
                if isinstance(obj, BaseModel):
                    return obj.model_dump()
                elif hasattr(obj, "value"):  # Enum support
                    return obj.value
                elif isinstance(obj, dict):
                    return {k: _convert(v) for k, v in obj.items()}
                elif isinstance(obj, (list, tuple)):
                    return [_convert(item) for item in obj]
                return obj

            res = {}
            for field in dataclasses.fields(self):
                val = getattr(self, field.name, field.default)
                res[field.name] = _convert(val)
            return res

        def model_dump_json(self, indent: Optional[int] = None) -> str:
            return json.dumps(self.model_dump(), indent=indent, default=str)

        @classmethod
        def model_validate(cls: Type[T], obj: Any) -> T:
            if isinstance(obj, cls):
                return obj
            if not isinstance(obj, dict):
                raise ValueError(f"Expected dict or {cls.__name__}, got {type(obj)}")
            
            field_map = {f.name: f for f in dataclasses.fields(cls)}
            kwargs = {}
            for k, v in obj.items():
                if k in field_map:
                    f_info = field_map[k]
                    # Check if target is a sub-model
                    type_hint = f_info.type
                    # Handle basic nested BaseModel parsing
                    if isinstance(type_hint, type) and issubclass(type_hint, BaseModel) and isinstance(v, dict):
                        kwargs[k] = type_hint.model_validate(v)
                    elif hasattr(type_hint, "__origin__") and type_hint.__origin__ is list and isinstance(v, list):
                        args = getattr(type_hint, "__args__", ())
                        if args and isinstance(args[0], type) and issubclass(args[0], BaseModel):
                            kwargs[k] = [args[0].model_validate(item) for item in v]
                        else:
                            kwargs[k] = v
                    else:
                        kwargs[k] = v
            return cls(**kwargs)
