
export const translations = {
  en: {
    appTitle: "SmartLens AI",
    upload: "Upload",
    download: "Download",
    noImageTitle: "No image loaded",
    noImageDesc: "Upload an image to start editing with AI-powered tools.",
    selectFromComputer: "Select from computer",
    
    // Categories
    adjustments: "Light & Color",
    effects: "Effects",
    transform: "Transform",
    tools: "Tools",
    reset: "Reset",
    
    // Tools
    brightness: "Brightness",
    contrast: "Contrast",
    saturation: "Saturation",
    hue: "Hue Rotate",
    blur: "Blur",
    grayscale: "Grayscale",
    sepia: "Sepia",
    invert: "Invert",
    vignette: "Vignette",
    
    rotate: "Rotate",
    flipX: "Flip X",
    crop: "Crop",
    cropMode: "Crop Image",
    ratio: "Aspect Ratio",
    zoom: "Zoom / Scale",
    apply: "Apply",
    cancel: "Cancel",
    original: "Original",
    square: "Square",
    landscape: "16:9",
    portrait: "4:3",
    
    aiAssistant: "AI Assistant",
    poweredBy: "Powered by Gemini 2.5",
    analyzeButton: "Analyze & Auto-Enhance",
    reAnalyze: "Re-analyze",
    analyzing: "Calculating optimal settings...",
    description: "Analysis",
    suggestedEdits: "Suggestions",
    aiPrompt: "Let AI analyze lighting and composition to auto-enhance your photo.",
    uploadToEnable: "Upload an image to enable AI analysis.",
    noImageSelected: "No image selected",
    switchToLight: "Switch to Light Mode",
    switchToDark: "Switch to Dark Mode",
    switchLang: "VN", // Label to switch TO Vietnamese
    analyzingError: "Could not analyze image.",
    defaultSuggestion1: "Try adjusting brightness manually.",
    defaultSuggestion2: "Experiment with contrast.",
    
    // Auto Enhance
    applyAi: "Apply AI Adjustments",
    aiApplied: "AI Enhancements Applied!",
    confidence: "AI Confidence"
  },
  vi: {
    appTitle: "SmartLens AI",
    upload: "Tải lên",
    download: "Tải xuống",
    noImageTitle: "Chưa có ảnh",
    noImageDesc: "Tải ảnh lên để bắt đầu chỉnh sửa với các công cụ AI.",
    selectFromComputer: "Chọn từ máy tính",
    
    // Categories
    adjustments: "Ánh sáng & Màu",
    effects: "Hiệu ứng",
    transform: "Biến đổi",
    tools: "Công cụ",
    reset: "Đặt lại",
    
    // Tools
    brightness: "Độ sáng",
    contrast: "Tương phản",
    saturation: "Độ bão hòa",
    hue: "Tông màu (Hue)",
    blur: "Làm mờ",
    grayscale: "Đen trắng",
    sepia: "Màu xưa cũ",
    invert: "Đảo ngược màu",
    vignette: "Làm tối góc",
    
    rotate: "Xoay",
    flipX: "Lật ngang",
    crop: "Cắt ảnh",
    cropMode: "Chế độ Cắt",
    ratio: "Tỷ lệ khung hình",
    zoom: "Phóng to / Thu nhỏ",
    apply: "Áp dụng",
    cancel: "Hủy bỏ",
    original: "Gốc",
    square: "Vuông",
    landscape: "16:9",
    portrait: "4:3",
    
    aiAssistant: "Trợ lý AI",
    poweredBy: "Hỗ trợ bởi Gemini 2.5",
    analyzeButton: "Phân tích & Tối ưu",
    reAnalyze: "Phân tích lại",
    analyzing: "Đang tính toán thông số tối ưu...",
    description: "Phân tích",
    suggestedEdits: "Gợi ý",
    aiPrompt: "Để AI phân tích ánh sáng và bố cục, tự động tối ưu hóa ảnh của bạn.",
    uploadToEnable: "Tải ảnh lên để bật tính năng phân tích AI.",
    noImageSelected: "Chưa chọn ảnh",
    switchToLight: "Chuyển sang chế độ sáng",
    switchToDark: "Chuyển sang chế độ tối",
    switchLang: "EN", // Label to switch TO English
    analyzingError: "Không thể phân tích ảnh.",
    defaultSuggestion1: "Thử điều chỉnh độ sáng thủ công.",
    defaultSuggestion2: "Thử thay đổi độ tương phản.",
    
    // Auto Enhance
    applyAi: "Áp dụng thông số AI",
    aiApplied: "Đã áp dụng tối ưu hóa!",
    confidence: "Độ tin cậy AI"
  }
};

export type Translation = typeof translations.en;
export type Language = 'en' | 'vi';
