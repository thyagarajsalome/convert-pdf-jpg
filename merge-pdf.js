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

// App State
let uploadedPdfs = []; // Array of { id, file, name, size, pageCount }

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
  if (files.length > 0) handleFiles(files);
});

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleFiles(e.target.files);
});

// Process Selected PDF Files
const handleFiles = async (files) => {
  const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
  if (pdfFiles.length === 0) {
    alert('Please select valid PDF files.');
    return;
  }
  
  // Disable buttons while loading pages info
  convertBtn.setAttribute('disabled', 'true');
  
  for (const file of pdfFiles) {
    try {
      const pageCount = await getPageCount(file);
      uploadedPdfs.push({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        pageCount
      });
    } catch (error) {
      console.error(error);
      alert(`Error reading PDF file: ${file.name}. It might be encrypted or corrupted.`);
    }
  }
  
  updateUI();
};

// Retrieve Page Count using pdf-lib
const getPageCount = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
  return pdfDoc.getPageCount();
};

const updateUI = () => {
  if (uploadedPdfs.length > 0) {
    dropZone.style.display = 'none';
    previewSection.style.display = 'flex';
    
    // Enable convert if 2 or more files are loaded
    if (uploadedPdfs.length >= 2) {
      convertBtn.removeAttribute('disabled');
    } else {
      convertBtn.setAttribute('disabled', 'true');
    }
    
    renderPreviewGrid();
  } else {
    dropZone.style.display = 'block';
    previewSection.style.display = 'none';
    convertBtn.setAttribute('disabled', 'true');
    previewGrid.innerHTML = '';
  }
};

// Render Previews Grid (shows PDF file cards with re-ordering controls)
const renderPreviewGrid = () => {
  previewGrid.innerHTML = '';
  
  uploadedPdfs.forEach((pdf, index) => {
    const card = document.createElement('div');
    card.className = 'preview-card';
    card.style.background = 'var(--bg-secondary)';
    card.style.padding = '1.5rem';
    
    // PDF details header
    const fileContainer = document.createElement('div');
    fileContainer.style.display = 'flex';
    fileContainer.style.alignItems = 'center';
    fileContainer.style.gap = '1rem';
    fileContainer.style.marginBottom = '1rem';
    
    const fileIcon = document.createElement('div');
    fileIcon.style.fontSize = '2.5rem';
    fileIcon.style.color = '#ef4444';
    fileIcon.innerHTML = '<i class="fa-solid fa-file-pdf"></i>';
    
    const details = document.createElement('div');
    details.style.display = 'flex';
    details.style.flexDirection = 'column';
    details.style.overflow = 'hidden';
    
    const name = document.createElement('span');
    name.style.fontWeight = '700';
    name.style.fontSize = '1.05rem';
    name.style.whiteSpace = 'nowrap';
    name.style.overflow = 'hidden';
    name.style.textOverflow = 'ellipsis';
    name.style.maxWidth = '180px';
    name.textContent = pdf.name;
    name.title = pdf.name;
    
    const metaInfo = document.createElement('span');
    metaInfo.style.fontSize = '0.85rem';
    metaInfo.style.color = 'var(--text-secondary)';
    metaInfo.textContent = `${formatBytes(pdf.size)} • ${pdf.pageCount} page(s)`;
    
    details.appendChild(name);
    details.appendChild(metaInfo);
    fileContainer.appendChild(fileIcon);
    fileContainer.appendChild(details);
    card.appendChild(fileContainer);
    
    // Operations Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.justifyContent = 'space-between';
    toolbar.style.alignItems = 'center';
    toolbar.style.borderTop = '1px solid var(--border-color)';
    toolbar.style.paddingTop = '1rem';
    
    const orderControls = document.createElement('div');
    orderControls.style.display = 'flex';
    orderControls.style.gap = '0.5rem';
    
    const moveLeft = document.createElement('button');
    moveLeft.className = 'btn-secondary';
    moveLeft.style.padding = '0.4rem 0.8rem';
    moveLeft.title = 'Move Up / Left';
    moveLeft.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
    moveLeft.disabled = index === 0;
    moveLeft.addEventListener('click', () => swapElements(index, index - 1));
    
    const moveRight = document.createElement('button');
    moveRight.className = 'btn-secondary';
    moveRight.style.padding = '0.4rem 0.8rem';
    moveRight.title = 'Move Down / Right';
    moveRight.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
    moveRight.disabled = index === uploadedPdfs.length - 1;
    moveRight.addEventListener('click', () => swapElements(index, index + 1));
    
    orderControls.appendChild(moveLeft);
    orderControls.appendChild(moveRight);
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'download-single-btn';
    removeBtn.style.color = 'var(--danger)';
    removeBtn.style.background = 'rgba(244, 63, 94, 0.08)';
    removeBtn.title = 'Remove file';
    removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    removeBtn.addEventListener('click', () => {
      uploadedPdfs.splice(index, 1);
      updateUI();
    });
    
    toolbar.appendChild(orderControls);
    toolbar.appendChild(removeBtn);
    card.appendChild(toolbar);
    
    previewGrid.appendChild(card);
  });
};

const swapElements = (index1, index2) => {
  const temp = uploadedPdfs[index1];
  uploadedPdfs[index1] = uploadedPdfs[index2];
  uploadedPdfs[index2] = temp;
  renderPreviewGrid();
};

// Clear All
clearAllBtn.addEventListener('click', () => {
  uploadedPdfs = [];
  fileInput.value = '';
  updateUI();
  progressContainer.style.display = 'none';
});

// PDF Merging Compilation
convertBtn.addEventListener('click', async () => {
  if (uploadedPdfs.length < 2) return;
  
  convertBtn.setAttribute('disabled', 'true');
  clearAllBtn.setAttribute('disabled', 'true');
  progressContainer.style.display = 'flex';
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
  progressText.textContent = 'Initializing merged PDF document...';
  
  try {
    const mergedPdf = await PDFLib.PDFDocument.create();
    const totalFiles = uploadedPdfs.length;
    
    for (let i = 0; i < totalFiles; i++) {
      progressText.textContent = `Merging file ${i + 1} of ${totalFiles}: ${uploadedPdfs[i].name}...`;
      
      const fileData = uploadedPdfs[i];
      const arrayBuffer = await fileData.file.arrayBuffer();
      
      // Load source PDF
      const srcDoc = await PDFLib.PDFDocument.load(arrayBuffer);
      
      // Copy all page objects
      const pageIndices = srcDoc.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);
      
      // Add each copied page object to output document
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
      
      const percent = Math.round(((i + 1) / totalFiles) * 100);
      progressBar.style.width = `${percent}%`;
      progressPercent.textContent = `${percent}%`;
    }
    
    progressText.textContent = 'Saving merged document...';
    
    // Compile PDF bytes
    const pdfBytes = await mergedPdf.save();
    const mergedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    progressText.textContent = 'Merged document ready for download!';
    
    // Download merged PDF
    const link = document.createElement('a');
    link.href = URL.createObjectURL(mergedBlob);
    link.download = 'merged_documents.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('PDF Merging Error:', error);
    alert('An error occurred while merging your PDF files. Please verify that the documents are valid and not password-protected.');
  } finally {
    convertBtn.removeAttribute('disabled');
    clearAllBtn.removeAttribute('disabled');
  }
});

// Initialize Theme
initTheme();
