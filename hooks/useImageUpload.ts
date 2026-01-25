import { useState, useRef } from 'react';
import { supabase } from '../supabase';

interface UseImageUploadOptions {
    bucket: string;
    maxSizeMB?: number;
    minDimension?: number;
    acceptedTypes?: string[];
}

export const useImageUpload = ({
    bucket,
    maxSizeMB = 2,
    minDimension = 150,
    acceptedTypes = ['image/jpeg', 'image/png']
}: UseImageUploadOptions) => {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const size = 300;
                canvas.width = size;
                canvas.height = size;
                const minDim = Math.min(img.width, img.height);
                const sx = (img.width - minDim) / 2;
                const sy = (img.height - minDim) / 2;
                if (ctx) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, size, size);
                    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
                }
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas blob error'));
                }, 'image/webp', 0.85);
            };
            img.onerror = reject;
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!acceptedTypes.includes(file.type)) {
            throw new Error(`Formato inválido. Use ${acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(' ou ')}.`);
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            throw new Error(`Arquivo muito grande. Máximo ${maxSizeMB}MB.`);
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                if (img.width < minDimension || img.height < minDimension) {
                    reject(new Error(`A imagem deve ter pelo menos ${minDimension}x${minDimension} pixels.`));
                } else {
                    resolve();
                }
            };
            img.onerror = () => reject(new Error('Erro ao carregar imagem.'));
        });

        try {
            const processed = await processImage(file);
            setPreviewBlob(processed);
            setPreviewUrl(URL.createObjectURL(processed));
        } catch (err) {
            console.error(err);
            throw new Error('Erro ao processar imagem.');
        }
    };

    const upload = async (path: string): Promise<string> => {
        if (!previewBlob) throw new Error('Nenhuma imagem para enviar.');

        try {
            setUploading(true);
            const processedFile = new File([previewBlob], 'image.webp', { type: 'image/webp' });

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(path, processedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
            return `${publicUrl}?t=${Date.now()}`;
        } finally {
            setUploading(false);
        }
    };

    const cancel = () => {
        setPreviewUrl(null);
        setPreviewBlob(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return {
        uploading,
        previewUrl,
        fileInputRef,
        handleFileSelect,
        upload,
        cancel
    };
};
