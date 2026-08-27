import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from './ui';
import { QrCode, X } from 'lucide-react';

export default function QRCodeAluna({ inline = false }) {
  const [token, setToken] = useState(null);
  const [date, setDate] = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    api.get('/checkin/token').then((r) => {
      setToken(r.data.token);
      setDate(r.data.date);
    }).catch(() => {});
  }, []);

  if (!token) return null;

  const qrContent = (size, showLabel = true) => (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-lg">
        <QRCodeSVG value={token} size={size} level="M" />
      </div>
      {showLabel && (
        <>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Apresente na recepção</p>
          <p className="text-[10px] text-muted">{date}</p>
        </>
      )}
    </div>
  );

  if (inline) {
    return (
      <button
        onClick={() => setFullscreen(true)}
        className="relative text-muted hover:text-accent transition-colors"
        data-testid="qr-quick-button"
        aria-label="Meu QR Code"
      >
        <QrCode size={20} />
        {fullscreen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center"
            onClick={(e) => { e.stopPropagation(); setFullscreen(false); }}
            data-testid="qr-fullscreen"
          >
            <button className="absolute top-6 right-6 text-muted hover:text-white transition-colors" aria-label="Fechar">
              <X size={24} />
            </button>
            <p className="font-display text-3xl uppercase tracking-tight mb-6">Meu Check-in</p>
            {qrContent(240)}
          </div>
        )}
      </button>
    );
  }

  return (
    <Card className="p-6 fade-up" data-testid="qr-card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Check-in</p>
        <button
          onClick={() => setFullscreen(true)}
          className="text-xs text-accent hover:text-accenth transition-colors"
          data-testid="qr-expand-button"
        >
          Ampliar
        </button>
      </div>
      {qrContent(160)}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center"
          onClick={() => setFullscreen(false)}
          data-testid="qr-fullscreen"
        >
          <button className="absolute top-6 right-6 text-muted hover:text-white transition-colors" aria-label="Fechar">
            <X size={24} />
          </button>
          <p className="font-display text-3xl uppercase tracking-tight mb-6">Meu Check-in</p>
          {qrContent(280)}
        </div>
      )}
    </Card>
  );
}
