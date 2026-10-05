"""ConvLSTM architecture for spatiotemporal weather anomaly forecasting."""

import torch
import torch.nn as nn
from typing import Tuple


class ConvLSTMCell(nn.Module):
    """2D Convolutional LSTM Cell."""
    
    def __init__(self, in_channels: int, hidden_dim: int, kernel_size: int = 3):
        super().__init__()
        self.in_channels = in_channels
        self.hidden_dim = hidden_dim
        padding = kernel_size // 2
        
        self.conv = nn.Conv2d(
            in_channels=in_channels + hidden_dim,
            out_channels=4 * hidden_dim,
            kernel_size=kernel_size,
            padding=padding,
            bias=True,
        )

    def forward(self, x: torch.Tensor, h_prev: torch.Tensor, c_prev: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        combined = torch.cat([x, h_prev], dim=1)
        gates = self.conv(combined)
        
        i, f, o, g = torch.split(gates, self.hidden_dim, dim=1)
        i = torch.sigmoid(i)
        f = torch.sigmoid(f)
        o = torch.sigmoid(o)
        g = torch.tanh(g)
        
        c_cur = f * c_prev + i * g
        h_cur = o * torch.tanh(c_cur)
        return h_cur, c_cur


class WeatherConvLSTM(nn.Module):
    """Sequence-to-sequence ConvLSTM that encodes 7 past days and forecasts 1-3 days ahead."""
    
    def __init__(
        self,
        in_channels: int = 6,
        hidden_dim: int = 32,
        out_channels: int = 6,
        lead_steps: int = 3,
        kernel_size: int = 3,
    ):
        super().__init__()
        self.in_channels = in_channels
        self.hidden_dim = hidden_dim
        self.out_channels = out_channels
        self.lead_steps = lead_steps
        
        self.encoder_cell = ConvLSTMCell(in_channels, hidden_dim, kernel_size=kernel_size)
        self.decoder_cell = ConvLSTMCell(out_channels, hidden_dim, kernel_size=kernel_size)
        self.output_conv = nn.Conv2d(hidden_dim, out_channels, kernel_size=1)

    def forward(self, x_seq: torch.Tensor) -> torch.Tensor:
        # x_seq: (B, T_past, C, H, W)
        b, t_past, c, h, w = x_seq.shape
        device = x_seq.device
        
        h_state = torch.zeros(b, self.hidden_dim, h, w, device=device)
        c_state = torch.zeros(b, self.hidden_dim, h, w, device=device)
        
        # Encode past sequence
        for t in range(t_past):
            x_t = x_seq[:, t]
            h_state, c_state = self.encoder_cell(x_t, h_state, c_state)
            
        # Decode future lead steps autoregressively
        outputs = []
        curr_input = x_seq[:, -1] # Start decoding from the most recent observed day
        
        for _ in range(self.lead_steps):
            h_state, c_state = self.decoder_cell(curr_input, h_state, c_state)
            pred_t = self.output_conv(h_state)
            outputs.append(pred_t)
            curr_input = pred_t # Feed prediction forward
            
        # Stack to (B, lead_steps, C, H, W)
        return torch.stack(outputs, dim=1)
