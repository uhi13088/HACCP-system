import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { RotateCcw, Download, Check } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange?: (signature: string) => void;
  width?: number;
  height?: number;
  className?: string;
  label?: string;
  required?: boolean;
}

export function SignaturePad({
  value = '',
  onChange,
  width = 400,
  height = 200,
  className = '',
  label = '서명',
  required = false
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 실제 크기 설정 (고해상도 대응)
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    ctx.scale(dpr, dpr);
    
    // 캔버스 스타일 크기는 CSS로 제어
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // 캔버스 설정
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 기존 서명이 있으면 로드
    if (value && value !== '') {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
        setIsEmpty(false);
      };
      img.src = value;
    }
  }, [value, width, height]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault(); // 스크롤 등 기본 동작 방지
    setIsDrawing(true);
    setIsEmpty(false);

    let x, y;
    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
      y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
    } else {
      x = (e.clientX - rect.left) * (canvas.width / rect.width);
      y = (e.clientY - rect.top) * (canvas.height / rect.height);
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault(); // 스크롤 등 기본 동작 방지

    let x, y;
    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
      y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
    } else {
      x = (e.clientX - rect.left) * (canvas.width / rect.width);
      y = (e.clientY - rect.top) * (canvas.height / rect.height);
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // 서명을 10KB 이하로 압축하여 base64로 변환
    const compressedSignature = compressSignature(canvas);
    onChange?.(compressedSignature);
  };

  // 서명 압축 함수 (10KB 이하)
  const compressSignature = (canvas: HTMLCanvasElement): string => {
    // 이미지 압축을 위한 임시 캔버스 생성
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // 압축된 크기로 설정 (원본의 60% 크기)
    const compressedWidth = Math.floor(canvas.width * 0.6);
    const compressedHeight = Math.floor(canvas.height * 0.6);
    
    tempCanvas.width = compressedWidth;
    tempCanvas.height = compressedHeight;
    
    if (!tempCtx) return canvas.toDataURL('image/png');
    
    // 배경을 흰색으로 설정 (JPEG 압축을 위해)
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, compressedWidth, compressedHeight);
    
    // 원본 캔버스를 압축된 크기로 그리기
    tempCtx.drawImage(canvas, 0, 0, compressedWidth, compressedHeight);
    
    // 품질을 조정하여 JPEG로 변환 (더 작은 파일 크기)
    let quality = 0.4; // 초기 품질
    let dataURL = tempCanvas.toDataURL('image/jpeg', quality);
    
    // 10KB 이하가 될 때까지 품질 조정 (13653 ≈ 10KB in base64)
    while (dataURL.length > 13653 && quality > 0.1) {
      quality -= 0.05;
      dataURL = tempCanvas.toDataURL('image/jpeg', quality);
    }
    
    // 여전히 크면 더 작은 크기로 재압축
    if (dataURL.length > 13653) {
      const smallerWidth = Math.floor(compressedWidth * 0.8);
      const smallerHeight = Math.floor(compressedHeight * 0.8);
      
      tempCanvas.width = smallerWidth;
      tempCanvas.height = smallerHeight;
      
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, smallerWidth, smallerHeight);
      tempCtx.drawImage(canvas, 0, 0, smallerWidth, smallerHeight);
      
      dataURL = tempCanvas.toDataURL('image/jpeg', 0.3);
    }
    
    console.log(`서명 이미지 크기: ${Math.round(dataURL.length * 0.75 / 1024)}KB (품질: ${quality})`);
    return dataURL;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange?.('');
  };

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const link = document.createElement('a');
    link.download = `signature_${new Date().getTime()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Card className="p-4">
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="block cursor-crosshair touch-none w-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ 
                maxWidth: `${width}px`,
                aspectRatio: `${width}/${height}`,
                border: '1px solid #e5e7eb'
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
                disabled={isEmpty}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                지우기
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadSignature}
                disabled={isEmpty}
              >
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
            </div>
            
            {!isEmpty && (
              <div className="flex items-center text-sm text-green-600">
                <Check className="w-4 h-4 mr-1" />
                서명 완료
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            마우스나 터치를 사용하여 위 영역에 서명해주세요.
          </p>
        </div>
      </Card>
    </div>
  );
}