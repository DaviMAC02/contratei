import React, { useState, useEffect } from "react";
import { TextField, TextFieldProps, InputAdornment } from "@mui/material";
import { Search } from "lucide-react";

interface DebouncedInputProps extends Omit<TextFieldProps, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounceMs = 300,
  ...props
}: DebouncedInputProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [value, debounceMs, onChange]);

  return (
    <TextField
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      size="small"
      placeholder="Buscar..."
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search style={{ width: 20, height: 20, color: "#6b7280" }} />
          </InputAdornment>
        ),
        ...props.InputProps,
      }}
      sx={{
        flex: 1,
        "& .MuiOutlinedInput-root": {
          height: 42,
          backgroundColor: "#fff",
        },
        ...props.sx,
      }}
    />
  );
}
