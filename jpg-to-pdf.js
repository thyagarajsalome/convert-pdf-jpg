// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewSection = document.getElementById('preview-section');
const previewGrid = document.getElementById('preview-grid');
const clearAllBtn = document.getElementById('clear-all-btn');
const convertBtn = document.getElementById('convert-btn');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const faqQuestions = document.querySelectorAll('.faq-question');

// Option Selectors
const pageSizeBtns = document.querySelectorAll('#page-size-selector .format-btn');
const orientationBtns = document.querySelectorAll('#orientation-selector .format-btn');
const marginBtns = document.querySelectorAll('#margin-selector .format-btn');

// App State
let uploadedImages = []; // Array of { id, file, name, dataUrl, width, height }
let currentPageSize = 'a4'; // a4, letter, fit
let currentOrientation = 'portrait'; // portrait, landscape, auto
let currentMargin = 'none'; // none, small, large

// Theme Management
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
};

const updateThemeIcon = (theme) => {
  const icon = themeToggleBtn.querySelector('i');
  icon.className = theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
};

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
});

// FAQ Accordion
faqQuestions.forEach(question => {
  question.addEventListener('click', () => {
    const item = question.parentElement;
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    if (!isActive) {
      item.classList.add('active');
    }
  });
});

// Drag & Drop
['dragenter', 'dragover'].forEach(eventName => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
  }, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
  }, false);
});

dropZone.addEventListener('drop', (e) => {
  const files = e.dataTransfer.files;
  if (files.length > 0) handleFiles(files);
});

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleFiles(e.target.files);
});

// Process Image Files
const handleFiles = async (files) => {
  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (imageFiles.length === 0) {
    alert('Please select valid image files (JPG, PNG, WebP).');
    return;
  }
  
  for (const file of imageFiles) {
    const dataUrl = await readFileAsDataUrl(file);
    const dimensions = await getImageDimensions(dataUrl);
    
    uploadedImages.push({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      dataUrl,
      width: dimensions.width,
      height: dimensions.height
    });
  }
  
  updateUI();
};

const readFileAsDataUrl = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
};

const getImageDimensions = (dataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = dataUrl;
  });
};

// UI updates
const updateUI = () => {
  if (uploadedImages.length > 0) {
    dropZone.style.display = 'none';
    previewSection.style.display = 'flex';
    convertBtn.removeAttribute('disabled');
    renderPreviewGrid();
  } else {
    dropZone.style.display = 'block';
    previewSection.style.display = 'none';
    convertBtn.setAttribute('disabled', 'true');
    previewGrid.innerHTML = '';
  }
};

// Render Previews with Re-ordering Buttons
const renderPreviewGrid = () => {
  previewGrid.innerHTML = '';
  
  uploadedImages.forEach((img, index) => {
    const card = document.createElement('div');
    card.className = 'preview-card';
    
    // Canvas Container to host image preview
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';
    
    const imgEl = document.createElement('img');
    imgEl.src = img.dataUrl;
    imgEl.style.width = '100%';
    imgEl.style.height = '100%';
    imgEl.style.objectFit = 'contain';
    canvasContainer.appendChild(imgEl);
    
    // Image Controls Toolbar (Move Up, Move Down, Delete)
    const toolbar = document.createElement('div');
    toolbar.className = 'page-toolbar';
    toolbar.style.bottom = '15px'; // Always visible on mobile/desktop
    
    // Move Left / Up button
    const moveUpBtn = document.createElement('button');
    moveUpBtn.className = 'toolbar-btn';
    moveUpBtn.title = 'Move Up / Left';
    moveUpBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
    moveUpBtn.disabled = index === 0;
    moveUpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      swapElements(index, index - 1);
    });
    
    // Move Right / Down button
    const moveDownBtn = document.createElement('button');
    moveDownBtn.className = 'toolbar-btn';
    moveDownBtn.title = 'Move Down / Right';
    moveDownBtn.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
    moveDownBtn.disabled = index === uploadedImages.length - 1;
    moveDownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      swapElements(index, index + 1);
    });
    
    toolbar.appendChild(moveUpBtn);
    toolbar.appendChild(moveDownBtn);
    canvasContainer.appendChild(toolbar);
    card.appendChild(canvasContainer);
    
    // Card Footer details
    const meta = document.createElement('div');
    meta.className = 'preview-meta';
    
    const title = document.createElement('span');
    title.className = 'preview-title';
    title.textContent = `Page ${index + 1}`;
    title.style.maxWidth = '120px';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';
    title.style.whiteSpace = 'nowrap';
    title.title = img.name;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'download-single-btn';
    removeBtn.style.color = 'var(--danger)';
    removeBtn.style.background = 'rgba(244, 63, 94, 0.08)';
    removeBtn.title = 'Remove Image';
    removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      uploadedImages.splice(index, 1);
      updateUI();
    });
    
    meta.appendChild(title);
    meta.appendChild(removeBtn);
    card.appendChild(meta);
    
    previewGrid.appendChild(card);
  });
};

const swapElements = (index1, index2) => {
  const temp = uploadedImages[index1];
  uploadedImages[index1] = uploadedImages[index2];
  uploadedImages[index2] = temp;
  renderPreviewGrid();
};

// Clear All Images
clearAllBtn.addEventListener('click', () => {
  uploadedImages = [];
  fileInput.value = '';
  updateUI();
  progressContainer.style.display = 'none';
});

// Configure Options Click Events
pageSizeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    pageSizeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPageSize = btn.dataset.size;
  });
});

orientationBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    orientationBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentOrientation = btn.dataset.orient;
  });
});

marginBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    marginBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMargin = btn.dataset.margin;
  });
});

// Standard Dimensions in Points (1 inch = 72 points)
const PAGE_DIMENSIONS = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.0, height: 792.0 }
};

// Margins inside Points
const MARGIN_SIZES = {
  none: 0,
  small: 15,
  large: 36
};

// PDF Compiler Logic
convertBtn.addEventListener('click', async () => {
  if (uploadedImages.length === 0) return;
  
  convertBtn.setAttribute('disabled', 'true');
  clearAllBtn.setAttribute('disabled', 'true');
  progressContainer.style.display = 'flex';
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
  progressText.textContent = 'Initializing PDF document...';
  
  const { jsPDF } = window.jspdf;
  let doc = null;
  
  try {
    const totalImages = uploadedImages.length;
    
    for (let i = 0; i < totalImages; i++) {
      progressText.textContent = `Compiling page ${i + 1} of ${totalImages}...`;
      const img = uploadedImages[i];
      
      // Determine orientation and size for this page
      let pageOrientation = currentOrientation;
      if (currentOrientation === 'auto') {
        pageOrientation = img.width >= img.height ? 'landscape' : 'portrait';
      }
      
      let pageFormat = currentPageSize;
      let pw, ph;
      
      if (currentPageSize === 'fit') {
        // Create custom sized page based on image dimensions plus margin sizes
        const marginVal = MARGIN_SIZES[currentMargin];
        pw = img.width + (marginVal * 2);
        ph = img.height + (marginVal * 2);
        pageFormat = [pw, ph];
      } else {
        const dim = PAGE_DIMENSIONS[currentPageSize];
        pw = pageOrientation === 'portrait' ? dim.width : dim.height;
        ph = pageOrientation === 'portrait' ? dim.height : dim.width;
      }
      
      // Initialize doc on page 1 or add a page subsequently
      if (i === 0) {
        doc = new jsPDF({
          orientation: pageOrientation,
          unit: 'pt',
          format: pageFormat
        });
      } else {
        doc.addPage(pageFormat, pageOrientation);
      }
      
      // Math: Aspect ratio fitting with margins
      const margin = MARGIN_SIZES[currentMargin];
      const usableWidth = pw - (margin * 2);
      const usableHeight = ph - (margin * 2);
      
      const pageRatio = usableWidth / usableHeight;
      const imgRatio = img.width / img.height;
      
      let drawWidth, drawHeight;
      if (imgRatio > pageRatio) {
        // Fit by width
        drawWidth = usableWidth;
        drawHeight = usableWidth / imgRatio;
      } else {
        // Fit by height
        drawHeight = usableHeight;
        drawWidth = usableHeight * imgRatio;
      }
      
      // Center drawing on page
      const drawX = margin + (usableWidth - drawWidth) / 2;
      const drawY = margin + (usableHeight - drawHeight) / 2;
      
      // Draw image onto PDF (compressing WebP/PNG back to JPG format internally to control sizes)
      doc.addImage(img.dataUrl, 'JPEG', drawX, drawY, drawWidth, drawHeight);
      
      // Update progress
      const percent = Math.round(((i + 1) / totalImages) * 100);
      progressBar.style.width = `${percent}%`;
      progressPercent.textContent = `${percent}%`;
    }
    
    progressText.textContent = 'Saving PDF document...';
    
    // Save generated PDF file name
    const outputName = `${uploadedImages[0].name.replace(/\.[^/.]+$/, "")}_merged.pdf`;
    doc.save(outputName);
    
    progressText.textContent = 'PDF generated successfully!';
    
  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('An error occurred during PDF compilation. Please try again.');
  } finally {
    convertBtn.removeAttribute('disabled');
    clearAllBtn.removeAttribute('disabled');
  }
});

// Initialize Settings
initTheme();
