// Set PDF.js worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileMetaCard = document.getElementById('file-meta-card');
const fileNameEl = document.getElementById('file-name');
const fileSizeEl = document.getElementById('file-size');
const removeBtn = document.getElementById('remove-btn');
const convertBtn = document.getElementById('convert-btn');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const successCard = document.getElementById('success-card');
const compressionSavings = document.getElementById('compression-savings');
const downloadCompressedBtn = document.getElementById('download-compressed-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const faqQuestions = document.querySelectorAll('.faq-question');

// Options Selectors
const compressionBtns = document.querySelectorAll('#compression-selector .format-btn');
const dpiBtns = document.querySelectorAll('#dpi-selector .format-btn');
const qualitySlider = document.getElementById('quality-slider');
const qualityVal = document.getElementById('quality-val');

// App State
let currentFile = null;
let compressedPdfBlob = null;
let currentDpi = 150; 
let currentQuality = 0.70;
let currentPreset = 'recommended'; // extreme, recommended, low, custom

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
    alert('Invalid file format. Please upload a PDF file.');
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
  compressedPdfBlob = null;
  fileInput.value = '';
  
  dropZone.style.display = 'block';
  fileMetaCard.style.display = 'none';
  convertBtn.setAttribute('disabled', 'true');
  
  resetState();
});

const resetState = () => {
  successCard.style.display = 'none';
  progressContainer.style.display = 'none';
  compressedPdfBlob = null;
};

// Compression Level Presets
const updatePresetSettings = (preset) => {
  currentPreset = preset;
  
  // Set UI buttons active states
  compressionBtns.forEach(b => b.classList.remove('active'));
  const activePresetBtn = Array.from(compressionBtns).find(b => b.dataset.level === preset);
  if (activePresetBtn) activePresetBtn.classList.add('active');
  
  if (preset === 'extreme') {
    updateDpi(72);
    updateQuality(40);
  } else if (preset === 'recommended') {
    updateDpi(150);
    updateQuality(70);
  } else if (preset === 'low') {
    updateDpi(220);
    updateQuality(85);
  }
};

const updateDpi = (dpi) => {
  currentDpi = dpi;
  dpiBtns.forEach(b => b.classList.remove('active'));
  const activeDpiBtn = Array.from(dpiBtns).find(b => parseInt(b.dataset.dpi) === dpi);
  if (activeDpiBtn) activeDpiBtn.classList.add('active');
};

const updateQuality = (percent) => {
  currentQuality = percent / 100;
  qualitySlider.value = percent;
  qualityVal.textContent = `${percent}%`;
};

compressionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    updatePresetSettings(btn.dataset.level);
  });
});

dpiBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    updateDpi(parseInt(btn.dataset.dpi));
    currentPreset = 'custom';
    compressionBtns.forEach(b => b.classList.remove('active'));
  });
});

qualitySlider.addEventListener('input', (e) => {
  updateQuality(e.target.value);
  currentPreset = 'custom';
  compressionBtns.forEach(b => b.classList.remove('active'));
});

// PDF Compression Execution Loop
convertBtn.addEventListener('click', async () => {
  if (!currentFile) return;
  
  resetState();
  convertBtn.setAttribute('disabled', 'true');
  removeBtn.setAttribute('disabled', 'true');
  progressContainer.style.display = 'flex';
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
  progressText.textContent = 'Reading PDF structure...';
  
  const reader = new FileReader();
  
  reader.onload = async function() {
    try {
      const typedarray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
      const numPages = pdf.numPages;
      
      const { jsPDF } = window.jspdf;
      let outputDoc = null;
      
      const scale = currentDpi / 72; // DPI factor relative to standard PDF points
      
      for (let i = 1; i <= numPages; i++) {
        progressText.textContent = `Compressing page ${i} of ${numPages}...`;
        
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: scale });
        
        // Render to memory canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        // Compress as low/medium quality JPEG bytes
        const dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        
        // Dimensions of PDF page (in points)
        const pdfPageViewport = page.getViewport({ scale: 1.0 });
        const pw = pdfPageViewport.width;
        const ph = pdfPageViewport.height;
        const pageOrientation = pw >= ph ? 'landscape' : 'portrait';
        
        // Add page to compiled PDF output
        if (i === 1) {
          outputDoc = new jsPDF({
            orientation: pageOrientation,
            unit: 'pt',
            format: [pw, ph]
          });
        } else {
          outputDoc.addPage([pw, ph], pageOrientation);
        }
        
        outputDoc.addImage(dataUrl, 'JPEG', 0, 0, pw, ph);
        
        const percent = Math.round((i / numPages) * 100);
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
      }
      
      progressText.textContent = 'Calculating compressed size...';
      
      // Get resulting PDF blob size
      compressedPdfBlob = outputDoc.output('blob');
      
      // Calculate savings
      const origSize = currentFile.size;
      const compSize = compressedPdfBlob.size;
      const percentSaved = Math.round(((origSize - compSize) / origSize) * 100);
      
      // Update success card info
      if (compSize >= origSize) {
        compressionSavings.innerHTML = `Compressed size is <strong>${formatBytes(compSize)}</strong> (No savings, original file was already optimized).`;
      } else {
        compressionSavings.innerHTML = `Reduced from <strong>${formatBytes(origSize)}</strong> to <strong>${formatBytes(compSize)}</strong> (Saved <strong>${percentSaved}%</strong>!).`;
      }
      
      // Hide progress, show success card
      progressContainer.style.display = 'none';
      successCard.style.display = 'flex';
      
      // Re-enable actions
      convertBtn.removeAttribute('disabled');
      removeBtn.removeAttribute('disabled');
      
      successCard.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      alert('Error compressing PDF. Please verify that the PDF is valid and not password-protected.');
      convertBtn.removeAttribute('disabled');
      removeBtn.removeAttribute('disabled');
      progressContainer.style.display = 'none';
    }
  };
  
  reader.readAsArrayBuffer(currentFile);
});

// Download Action
downloadCompressedBtn.addEventListener('click', () => {
  if (!compressedPdfBlob) return;
  
  const originalName = currentFile.name.replace(/\.[^/.]+$/, "");
  const link = document.createElement('a');
  link.href = URL.createObjectURL(compressedPdfBlob);
  link.download = `${originalName}_compressed.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Initialize Theme
initTheme();
