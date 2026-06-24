import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

let detector: poseDetection.PoseDetector | null = null;
let animationId: number | null = null;

const PERSON_COLORS = [
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316'  // Orange
];

export async function initAI() {
    console.log("Cargando modelo AI Visual (Pose Detection)...");
    const badge = document.getElementById('ai-person-count-badge');
    const text = document.getElementById('ai-person-count');
    if (badge && text) {
        text.innerText = "Cargando IA...";
        badge.classList.remove('hidden');
    }
    try {
        await tf.ready();
        const detectorConfig = { modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING };
        detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
        console.log("Modelo AI Visual cargado");
        if (text) text.innerText = "IA Lista";
        setTimeout(() => { if (badge && !animationId) badge.classList.add('hidden'); }, 3000);
    } catch (e: any) {
        console.warn("No se pudo cargar el modelo AI Visual:", e.message || e);
        if (text) text.innerText = "Error IA (¿Sin internet?)";
    }
}

export function startDetection(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    if (!detector) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const countBadge = document.getElementById('ai-person-count-badge');
    const countText = document.getElementById('ai-person-count');
    const videoContainer = document.getElementById('video-preview-container');
    if (videoContainer) {
        videoContainer.classList.add('ring-2', 'ring-amber-500/50');
    }
    
    let gazeHeatmapPoints: {x: number, y: number, timestamp: number}[] = [];

    // Conexiones del esqueleto (pares de índices)
    const KEYPOINT_CONNECTIONS = [
        ['nose', 'left_eye'], ['left_eye', 'left_ear'], ['nose', 'right_eye'], ['right_eye', 'right_ear'],
        ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
        ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'],
        ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'], ['left_hip', 'left_knee'],
        ['left_knee', 'left_ankle'], ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
    ];

    async function detectFrame() {
        if (!detector) return;
        if (video.readyState < 2) {
            animationId = requestAnimationFrame(detectFrame);
            return;
        }

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        try {
            const poses = await detector.estimatePoses(video);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Filtrar y ordenar de izquierda a derecha
            const currentPoses = poses.filter(p => p.score && p.score > 0.3).sort((a, b) => {
                const getX = (pose: poseDetection.Pose) => pose.keypoints.find(k => k.name === 'nose')?.x || pose.box?.xMin || 0;
                return getX(a) - getX(b);
            });
            
            if (countText && countBadge) {
                countText.innerText = currentPoses.length.toString();
                if (currentPoses.length > 0) {
                    countBadge.classList.remove('hidden');
                } else {
                    countBadge.classList.add('hidden');
                }
            }
            
            currentPoses.forEach((pose, index) => {
                const color = 'rgba(0, 255, 255, 0.6)'; // Cyan translúcido y elegante
                
                // Subtle bounding box
                let boxX, boxY, boxW, boxH;
                if (pose.box) {
                    boxX = pose.box.xMin; boxY = pose.box.yMin; boxW = pose.box.width; boxH = pose.box.height;
                } else {
                    const xs = pose.keypoints.map(k => k.x);
                    const ys = pose.keypoints.map(k => k.y);
                    boxX = Math.min(...xs); boxY = Math.min(...ys);
                    boxW = Math.max(...xs) - boxX; boxH = Math.max(...ys) - boxY;
                }
                
                ctx.beginPath();
                ctx.rect(boxX, boxY, boxW, boxH);
                ctx.lineWidth = 2;
                ctx.strokeStyle = color;
                ctx.stroke();

                // Simple label
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(boxX, boxY > 20 ? boxY - 20 : 0, 100, 20);
                ctx.font = '12px Inter';
                ctx.fillStyle = '#00FFFF';
                ctx.fillText(`Persona ${index + 1}`, boxX + 5, boxY > 20 ? boxY - 5 : 15);
            });

        } catch(err) {
            console.warn(err);
        }

        animationId = requestAnimationFrame(detectFrame);
    }
    
    detectFrame();
}

export function stopDetection() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    const countBadge = document.getElementById('ai-person-count-badge');
    if (countBadge) countBadge.classList.add('hidden');
    
    const videoContainer = document.getElementById('video-preview-container');
    if (videoContainer) {
        videoContainer.classList.remove('ring-2', 'ring-amber-500/50');
    }
    
    const canvas = document.getElementById('overlay-canvas') as HTMLCanvasElement;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

(window as any).AIVision = {
    initAI, startDetection, stopDetection
};

initAI();
