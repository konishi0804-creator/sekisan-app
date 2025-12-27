
// Worker Config moved to inside function to strictly avoid SSR execution

const TARGET_SIZE = 1000;

export async function processFileToImage(file: File): Promise<File> {
    if (file.type === "application/pdf") {
        return convertPdfToImage(file);
    } else if (file.type.startsWith("image/")) {
        return normalizeImage(file);
    }
    throw new Error("Unsupported file type");
}

function createSquareCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = TARGET_SIZE;
    canvas.height = TARGET_SIZE;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error("Canvas context not available");

    // 1. Fill White Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

    // 2. Calculate Contain Logic
    const scale = Math.min(TARGET_SIZE / width, TARGET_SIZE / height);
    const renderW = width * scale;
    const renderH = height * scale;
    const offsetX = (TARGET_SIZE - renderW) / 2;
    const offsetY = (TARGET_SIZE - renderH) / 2;

    // 3. Draw Image Centered
    ctx.drawImage(source, offsetX, offsetY, renderW, renderH);

    return canvas;
}

async function convertPdfToImage(file: File): Promise<File> {
    const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");

    // Initialize worker only on client side when needed
    if (!GlobalWorkerOptions.workerSrc) {
        GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/cmaps/',
        cMapPacked: true,
    }).promise;

    const page = await pdf.getPage(1); // Get first page
    // Render at high resolution first to ensure quality when downscaling to 1000x1000 if needed
    // or upscaling. 
    // If we want 1000x1000 max, getting a viewport > 1000 is good.
    const viewport = page.getViewport({ scale: 2.0 });

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = viewport.width;
    tempCanvas.height = viewport.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) throw new Error("Canvas context not available");

    // @ts-ignore
    await page.render({
        canvasContext: tempCtx,
        viewport: viewport,
    }).promise;

    // Normalize to 1000x1000
    const finalCanvas = createSquareCanvas(tempCanvas, viewport.width, viewport.height);

    const blob = await new Promise<Blob | null>(resolve => finalCanvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Failed to create blob from PDF");

    return new File([blob], file.name.replace(".pdf", ".png"), { type: "image/png" });
}

async function normalizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                // Normalize to 1000x1000
                const finalCanvas = createSquareCanvas(img, img.naturalWidth, img.naturalHeight);

                finalCanvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".png"), { type: "image/png" }));
                    } else {
                        reject(new Error("Image normalization failed"));
                    }
                }, "image/png");
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}
