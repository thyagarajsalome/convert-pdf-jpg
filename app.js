// Set PDF.js worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Language Localization
const isHindi = document.documentElement.lang === 'hi';
const translations = {
  en: {
    invalidFormat: 'Invalid file format. Please upload a PDF file.',
    readingPdf: 'Reading PDF...',
    renderingPage: (i, total) => `Rendering page ${i} of ${total}...`,
    conversionComplete: 'Conversion complete!',
    errorConverting: 'Error converting PDF. Please ensure the document is not corrupted or password protected.',
    pageNumber: (num) => `Page ${num}`,
    downloadThisPage: 'Download this page',
    rotateCCW: 'Rotate Counter-Clockwise',
    rotateCW: 'Rotate Clockwise',
    downloadAll: 'Download All (ZIP)',
    downloadSelected: (count) => `Download Selected (${count}) (ZIP)`,
    downloadSelectedPlaceholder: 'Download Selected (ZIP)',
    packagingZip: 'Packaging ZIP...',
    failedZip: 'Failed to package zip file.',
    convertBtnText: (format) => `Convert PDF to ${format}`
  },
  hi: {
    invalidFormat: 'अमान्य फ़ाइल स्वरूप। कृपया एक पीडीएफ फ़ाइल अपलोड करें।',
    readingPdf: 'पीडीएफ पढ़ी जा रही है...',
    renderingPage: (i, total) => `पेज ${i} का ${total} रेंडर किया जा रहा है...`,
    conversionComplete: 'रूपांतरण पूरा हुआ!',
    errorConverting: 'पीडीएफ को बदलने में त्रुटि। कृपया सुनिश्चित करें कि दस्तावेज़ दूषित या पासवर्ड सुरक्षित नहीं है।',
    pageNumber: (num) => `पेज ${num}`,
    downloadThisPage: 'इस पेज को डाउनलोड करें',
    rotateCCW: 'वामावर्त घुमाएं',
    rotateCW: 'दक्षिणावर्त घुमाएं',
    downloadAll: 'सभी डाउनलोड करें (ZIP)',
    downloadSelected: (count) => `चुने गए डाउनलोड करें (${count}) (ZIP)`,
    downloadSelectedPlaceholder: 'चुने गए डाउनलोड करें (ZIP)',
    packagingZip: 'ZIP फ़ाइल तैयार की जा रही है...',
    failedZip: 'ZIP फ़ाइल तैयार करने में विफल।',
    convertBtnText: (format) => `पीडीएफ को ${format} में बदलें`
  }
};
const t = isHindi ? translations.hi : translations.en;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileMetaCard = document.getElementById('file-meta-card');
const fileNameEl = document.getElementById('file-name');
const fileSizeEl = document.getElementById('file-size');
const removeBtn = document.getElementById('remove-btn');
const dpiBtns = document.querySelectorAll('.dpi-btn');
const formatBtns = document.querySelectorAll('.format-btn');
const qualitySlider = document.getElementById('quality-slider');
const qualityVal = document.getElementById('quality-val');
const convertBtn = document.getElementById('convert-btn');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const previewSection = document.getElementById('preview-section');
const previewGrid = document.getElementById('preview-grid');
const downloadAllBtn = document.getElementById('download-all-btn');
const selectAllBtn = document.getElementById('select-all-btn');
const deselectAllBtn = document.getElementById('deselect-all-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const faqQuestions = document.querySelectorAll('.faq-question');

// App State
let currentFile = null;
let pdfDocument = null;
let currentDpi = 300; 
let currentFormat = 'image/jpeg'; // image/jpeg, image/png, image/webp
let currentQuality = 0.90; // 0.1 to 1.0
let pageStates = []; // Array of { pageNum, rotation: 0|90|180|270, selected: true, canvas: HTMLCanvasElement, dataUrl: string }

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

// Format Size Utility
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

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
  if (files.length > 0) handleFileSelect(files[0]);
});

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
});

// Handle File Selection
const handleFileSelect = (file) => {
  if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
    alert(t.invalidFormat);
    return;
  }
  
  currentFile = file;
  fileNameEl.textContent = file.name;
  fileSizeEl.textContent = formatBytes(file.size);
  
  dropZone.style.display = 'none';
  fileMetaCard.style.display = 'flex';
  convertBtn.removeAttribute('disabled');
  
  resetState();
};

// Remove File Action
removeBtn.addEventListener('click', () => {
  currentFile = null;
  pdfDocument = null;
  fileInput.value = '';
  
  dropZone.style.display = 'block';
  fileMetaCard.style.display = 'none';
  convertBtn.setAttribute('disabled', 'true');
  
  resetState();
  progressContainer.style.display = 'none';
});

const resetState = () => {
  previewSection.style.display = 'none';
  previewGrid.innerHTML = '';
  pageStates = [];
  downloadAllBtn.setAttribute('disabled', 'true');
};

// Selection controls
selectAllBtn.addEventListener('click', () => toggleAllSelection(true));
deselectAllBtn.addEventListener('click', () => toggleAllSelection(false));

const toggleAllSelection = (isSelected) => {
  pageStates.forEach(state => {
    state.selected = isSelected;
    const card = document.getElementById(`page-card-${state.pageNum}`);
    if (card) {
      if (isSelected) card.classList.add('selected');
      else card.classList.remove('selected');
    }
  });
  updateDownloadBtnLabel();
};

// Option selectors (DPI, Format, Quality)
dpiBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    dpiBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDpi = parseInt(btn.dataset.dpi);
  });
});

const updateConvertBtnLabel = () => {
  const ext = currentFormat.split('/')[1];
  const formatName = ext === 'jpeg' ? 'JPG' : ext.toUpperCase();
  const labelText = convertBtn.querySelector('span');
  if (labelText) {
    labelText.textContent = t.convertBtnText(formatName);
  }
};

formatBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    formatBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFormat = btn.dataset.format;
    
    // Update the conversion button's label based on selected image type
    updateConvertBtnLabel();
    
    // WebP and JPG support quality; PNG does not
    if (currentFormat === 'image/png') {
      qualitySlider.setAttribute('disabled', 'true');
    } else {
      qualitySlider.removeAttribute('disabled');
    }
    
    // Regenerate dataUrls instantly from already rendered canvases!
    if (pageStates.length > 0) {
      regenerateDataUrls();
    }
  });
});

qualitySlider.addEventListener('input', (e) => {
  const percent = e.target.value;
  qualityVal.textContent = `${percent}%`;
  currentQuality = percent / 100;
});

qualitySlider.addEventListener('change', () => {
  if (pageStates.length > 0 && currentFormat !== 'image/png') {
    regenerateDataUrls();
  }
});

// Regenerate Image Data URLs instantly from loaded canvases
const regenerateDataUrls = () => {
  pageStates.forEach(state => {
    state.dataUrl = state.canvas.toDataURL(currentFormat, currentQuality);
    
    // Update individual download buttons
    const card = document.getElementById(`page-card-${state.pageNum}`);
    if (card) {
      const ext = currentFormat.split('/')[1];
      const filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}_page_${state.pageNum}.${ext}`;
      const downloadBtn = card.querySelector('.download-single-btn');
      downloadBtn.onclick = () => downloadSingle(state.dataUrl, filename);
    }
  });
};

// Main Conversion Trigger
convertBtn.addEventListener('click', async () => {
  if (!currentFile) return;
  
  resetState();
  convertBtn.setAttribute('disabled', 'true');
  removeBtn.setAttribute('disabled', 'true');
  progressContainer.style.display = 'flex';
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
  progressText.textContent = t.readingPdf;
  
  const reader = new FileReader();
  
  reader.onload = async function() {
    try {
      const typedarray = new Uint8Array(this.result);
      pdfDocument = await pdfjsLib.getDocument({ data: typedarray }).promise;
      const numPages = pdfDocument.numPages;
      
      previewSection.style.display = 'flex';
      
      for (let i = 1; i <= numPages; i++) {
        progressText.textContent = t.renderingPage(i, numPages);
        
        await renderSinglePage(i);
        
        const percent = Math.round((i / numPages) * 100);
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
      }
      
      progressText.textContent = t.conversionComplete;
      downloadAllBtn.removeAttribute('disabled');
      removeBtn.removeAttribute('disabled');
      convertBtn.removeAttribute('disabled');
      updateDownloadBtnLabel();
      
      previewSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      alert(t.errorConverting);
      convertBtn.removeAttribute('disabled');
      removeBtn.removeAttribute('disabled');
      progressContainer.style.display = 'none';
    }
  };
  
  reader.readAsArrayBuffer(currentFile);
});

// Render Page and Append to Grid
const renderSinglePage = async (pageNum, isRotationChange = false) => {
  const page = await pdfDocument.getPage(pageNum);
  
  let state = pageStates.find(s => s.pageNum === pageNum);
  if (!state) {
    state = { pageNum, rotation: 0, selected: true, canvas: document.createElement('canvas'), dataUrl: '' };
    pageStates.push(state);
  }
  
  // Account for base rotation plus user rotation
  const totalRotation = (page.rotate + state.rotation) % 360;
  const scale = currentDpi / 72;
  const viewport = page.getViewport({ scale: scale, rotation: totalRotation });
  
  const canvas = state.canvas;
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({ canvasContext: context, viewport: viewport }).promise;
  
  state.dataUrl = canvas.toDataURL(currentFormat, currentQuality);
  
  const ext = currentFormat.split('/')[1];
  const filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}_page_${pageNum}.${ext}`;
  
  if (isRotationChange) {
    // Just update preview canvas & buttons
    const card = document.getElementById(`page-card-${pageNum}`);
    const canvasContainer = card.querySelector('.canvas-container');
    canvasContainer.innerHTML = '';
    
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    previewCanvas.getContext('2d').drawImage(canvas, 0, 0);
    canvasContainer.appendChild(previewCanvas);
    
    // Add toolbar overlay back
    createPageToolbar(canvasContainer, pageNum);
    
    // Update individual download
    const downloadBtn = card.querySelector('.download-single-btn');
    downloadBtn.onclick = () => downloadSingle(state.dataUrl, filename);
  } else {
    // Create card
    createPageCard(pageNum, state.canvas, state.dataUrl, filename);
  }
};

// Create Card
const createPageCard = (pageNum, renderedCanvas, dataUrl, filename) => {
  const card = document.createElement('div');
  card.className = 'preview-card selected';
  card.id = `page-card-${pageNum}`;
  
  // Selection checkbox overlay
  const selectOverlay = document.createElement('div');
  selectOverlay.className = 'card-select-overlay';
  
  const checkCustom = document.createElement('div');
  checkCustom.className = 'checkbox-custom';
  checkCustom.innerHTML = '<i class="fa-solid fa-check"></i>';
  checkCustom.addEventListener('click', (e) => {
    e.stopPropagation();
    const state = pageStates.find(s => s.pageNum === pageNum);
    state.selected = !state.selected;
    card.classList.toggle('selected', state.selected);
    updateDownloadBtnLabel();
  });
  
  selectOverlay.appendChild(checkCustom);
  card.appendChild(selectOverlay);
  
  // Canvas render container
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'canvas-container';
  canvasContainer.addEventListener('click', () => {
    const state = pageStates.find(s => s.pageNum === pageNum);
    state.selected = !state.selected;
    card.classList.toggle('selected', state.selected);
    updateDownloadBtnLabel();
  });
  
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = renderedCanvas.width;
  previewCanvas.height = renderedCanvas.height;
  previewCanvas.getContext('2d').drawImage(renderedCanvas, 0, 0);
  canvasContainer.appendChild(previewCanvas);
  
  // Toolbar overlay (Rotate)
  createPageToolbar(canvasContainer, pageNum);
  card.appendChild(canvasContainer);
  
  // Bottom meta
  const meta = document.createElement('div');
  meta.className = 'preview-meta';
  
  const title = document.createElement('span');
  title.className = 'preview-title';
  title.textContent = t.pageNumber(pageNum);
  
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'download-single-btn';
  downloadBtn.title = t.downloadThisPage;
  downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>';
  downloadBtn.onclick = (e) => {
    e.stopPropagation();
    downloadSingle(dataUrl, filename);
  };
  
  meta.appendChild(title);
  meta.appendChild(downloadBtn);
  card.appendChild(meta);
  
  previewGrid.appendChild(card);
};

// Toolbar overlay inside card for quick operations (e.g. rotation)
const createPageToolbar = (container, pageNum) => {
  const toolbar = document.createElement('div');
  toolbar.className = 'page-toolbar';
  
  const rotateLeft = document.createElement('button');
  rotateLeft.className = 'toolbar-btn';
  rotateLeft.title = t.rotateCCW;
  rotateLeft.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
  rotateLeft.addEventListener('click', async (e) => {
    e.stopPropagation();
    const state = pageStates.find(s => s.pageNum === pageNum);
    state.rotation = (state.rotation - 90 + 360) % 360;
    await renderSinglePage(pageNum, true);
  });
  
  const rotateRight = document.createElement('button');
  rotateRight.className = 'toolbar-btn';
  rotateRight.title = t.rotateCW;
  rotateRight.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
  rotateRight.addEventListener('click', async (e) => {
    e.stopPropagation();
    const state = pageStates.find(s => s.pageNum === pageNum);
    state.rotation = (state.rotation + 90) % 360;
    await renderSinglePage(pageNum, true);
  });
  
  toolbar.appendChild(rotateLeft);
  toolbar.appendChild(rotateRight);
  container.appendChild(toolbar);
};

// Download Single Image
const downloadSingle = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Update label of download button based on selection count
const updateDownloadBtnLabel = () => {
  const selectedCount = pageStates.filter(s => s.selected).length;
  const totalCount = pageStates.length;
  
  const icon = downloadAllBtn.querySelector('i');
  const labelText = downloadAllBtn.querySelector('span');
  
  if (selectedCount === totalCount) {
    labelText.textContent = t.downloadAll;
    downloadAllBtn.removeAttribute('disabled');
  } else if (selectedCount > 0) {
    labelText.textContent = t.downloadSelected(selectedCount);
    downloadAllBtn.removeAttribute('disabled');
  } else {
    labelText.textContent = t.downloadSelectedPlaceholder;
    downloadAllBtn.setAttribute('disabled', 'true');
  }
};

// Zip download logic
downloadAllBtn.addEventListener('click', async () => {
  const selectedPages = pageStates.filter(s => s.selected);
  if (selectedPages.length === 0) return;
  
  downloadAllBtn.setAttribute('disabled', 'true');
  const originalHtml = downloadAllBtn.innerHTML;
  downloadAllBtn.innerHTML = `<span class="spinner"></span> ${t.packagingZip}`;
  
  try {
    const zip = new JSZip();
    const ext = currentFormat.split('/')[1];
    
    selectedPages.forEach(state => {
      const base64Data = state.dataUrl.split(',')[1];
      const filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}_page_${state.pageNum}.${ext}`;
      zip.file(filename, base64Data, { base64: true });
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    const zipName = `${currentFile.name.replace(/\.[^/.]+$/, "")}_converted_images.zip`;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = zipName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error(error);
    alert(t.failedZip);
  } finally {
    downloadAllBtn.innerHTML = originalHtml;
    updateDownloadBtnLabel();
  }
});

// Initialize Theme & Button Label
initTheme();
updateConvertBtnLabel();
