const API_BASE='/api/items/';
const CAT_API_BASE='/api/categories/';

let itemsState=[];
let editingItemId=null;
let deletingItemId=null;
let currentPage='dashboard';

const PAGE_CONFIG={
  dashboard:{
    title:'SYSTEMS OVERVIEW',
    subtitle:'OPERATIONAL CONTROL CENTER',
    conditionFilter:'',
    statusFilter:'',
  },
  coach:{
    title:'COACH MANAGEMENT',
    subtitle:'HEAD COACHES & COACHING STAFF',
    conditionFilter:'Head Coach,Coach',
    statusFilter:'',
    tbodyId:'tableBodyCoach',
    wrapperId:'tableViewWrapperCoach',
    emptyId:'emptyStateCoach',
  },
  players:{
    title:'PLAYERS DIRECTORY',
    subtitle:'REGISTERED PLAYER ROSTER',
    conditionFilter:'Player',
    statusFilter:'',
    tbodyId:'tableBodyPlayers',
    wrapperId:'tableViewWrapperPlayers',
    emptyId:'emptyStatePlayers',
  },
  availability:{
    title:'PERSONNEL AVAILABILITY',
    subtitle:'READY & UNASSIGNED PERSONNEL',
    conditionFilter:'',
    statusFilter:'AVAILABLE',
    tbodyId:'tableBodyAvail',
    wrapperId:'tableViewWrapperAvail',
    emptyId:'emptyStateAvail',
  },
};

document.addEventListener('DOMContentLoaded', ()=>{
  initApp();
});

async function initApp(){
  setupEventListeners();
  await loadItems();
}

function setupEventListeners(){
  const searchInput=document.getElementById('searchInput');
  if(searchInput){
    searchInput.addEventListener('input', debounce(loadItems, 300));
  }

  document.querySelectorAll('.nav-item').forEach(item=>{
    item.addEventListener('click', (e)=>{
      e.preventDefault();
      const navKey=item.getAttribute('data-nav');
      if(!navKey || navKey==='settings') return;
      document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
      item.classList.add('active');
      switchPageView(navKey);
    });
  });

  ['openAddBtn','openAddBtnCoach','openAddBtnPlayers','openAddBtnAvail'].forEach(id=>{
    const btn=document.getElementById(id);
    if(btn) btn.addEventListener('click', openAddModal);
  });

  document.getElementById('closeFormModal').addEventListener('click', closeFormModal);
  document.getElementById('cancelFormBtn').addEventListener('click', closeFormModal);
  document.getElementById('itemForm').addEventListener('submit', handleFormSubmit);

  document.querySelectorAll('[id^="openAddBtn"]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const pt=document.getElementById('formPersonnelType');
      if(!pt) return;
      if(currentPage==='coach') pt.value='Coach';
      else if(currentPage==='players') pt.value='Player';
      else pt.value='';
    });
  });

  document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
}

function switchPageView(pageKey){
  if(!PAGE_CONFIG[pageKey]) return;
  currentPage=pageKey;

  document.querySelectorAll('.page-view').forEach(v=>v.classList.remove('active'));
  const target=document.getElementById(`view-${pageKey}`);
  if(target) target.classList.add('active');

  const cfg=PAGE_CONFIG[pageKey];
  const titleEl=document.getElementById('pageTitle');
  const subtitleEl=document.getElementById('pageSubtitle');
  if(titleEl) titleEl.textContent=cfg.title;
  if(subtitleEl) subtitleEl.innerHTML=`<div class="red-square-marker"></div> ${cfg.subtitle}`;

  loadItems();
}

async function loadItems(){
  const search=document.getElementById('searchInput')?.value.trim()||'';
  const cfg=PAGE_CONFIG[currentPage];

  let status=cfg.statusFilter;

  let url=`${API_BASE}?`;
  if(search) url+=`search=${encodeURIComponent(search)}&`;
  if(status) url+=`status=${encodeURIComponent(status)}&`;
  if(cfg.conditionFilter) url+=`condition=${encodeURIComponent(cfg.conditionFilter)}&`;

  try{
    const res=await fetch(url);
    if(!res.ok) throw new Error('API error');
    itemsState=await res.json();

    if(currentPage==='dashboard'){
      renderLedger('tableBody','tableViewWrapper','emptyState');
      updateStatsCards();
    }else{
      renderLedger(cfg.tbodyId, cfg.wrapperId, cfg.emptyId);
    }
  }catch(err){
    console.error('loadItems error:', err);
    showToast('DATABASE CONNECTION ERROR', 'error');
  }
}

async function updateStatsCards(){
  try{
    const res=await fetch(`${API_BASE}stats/`);
    if(res.ok){
      const s=await res.json();
      const el=id=>document.getElementById(id);
      if(el('statTotal')) el('statTotal').textContent=s.total_items??'—';
      if(el('statBorrowed')) el('statBorrowed').textContent=s.borrowed_items??'—';
      if(el('statAvailable')) el('statAvailable').textContent=s.available_items??'—';
      if(el('statMaintenance')) el('statMaintenance').textContent=s.maintenance_items??'—';
    }
  }catch{
    const el=id=>document.getElementById(id);
    if(el('statTotal')) el('statTotal').textContent=itemsState.length;
    if(el('statBorrowed')) el('statBorrowed').textContent=itemsState.filter(i=>i.status==='BORROWED').length;
    if(el('statAvailable')) el('statAvailable').textContent=itemsState.filter(i=>i.status==='AVAILABLE').length;
    if(el('statMaintenance')) el('statMaintenance').textContent=itemsState.filter(i=>i.status==='MAINTENANCE').length;
  }
}

async function handleFormSubmit(e){
  e.preventDefault();

  const title=document.getElementById('formTitle').value.trim();
  const personnelType=document.getElementById('formPersonnelType').value;
  const statusVal=document.getElementById('formStatus').value;
  const notes=document.getElementById('formNotes').value.trim();

  if(!title){ showToast('PLEASE ENTER A NAME.', 'error'); return; }
  if(!personnelType){ showToast('PLEASE SELECT A PERSONNEL TYPE.', 'error'); return; }

  const payload={
    title,
    condition:personnelType,
    status:statusVal,
    notes,
    category:null,
    borrower_name:'',
    borrower_email:'',
    due_date:null,
  };

  const isEdit=editingItemId!==null;
  const url=isEdit?`${API_BASE}${editingItemId}/`:API_BASE;
  const method=isEdit?'PUT':'POST';

  try{
    const res=await fetch(url, {
      method,
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify(payload),
    });
    if(!res.ok) throw new Error(await res.text());
    showToast(isEdit?'PERSONNEL RECORD UPDATED.':'NEW PERSONNEL ADDED TO ROSTER.', 'success');
    closeFormModal();
    await loadItems();
  }catch(err){
    console.error('Save error:', err);
    showToast('FAILED TO SAVE RECORD.', 'error');
  }
}

async function confirmDelete(){
  if(!deletingItemId) return;
  try{
    const res=await fetch(`${API_BASE}${deletingItemId}/`, { method:'DELETE' });
    if(res.status===204||res.ok){
      showToast('PERSONNEL REMOVED FROM ROSTER.', 'success');
      closeDeleteModal();
      await loadItems();
    }else throw new Error('Delete failed');
  }catch(err){
    console.error('Delete error:', err);
    showToast('COULD NOT DELETE RECORD.', 'error');
  }
}

function renderLedger(tbodyId, wrapperId, emptyId){
  const tbody=document.getElementById(tbodyId);
  const wrapper=document.getElementById(wrapperId);
  const emptyEl=document.getElementById(emptyId);
  if(!tbody) return;

  tbody.innerHTML='';

  if(itemsState.length===0){
    if(wrapper) wrapper.style.display='none';
    if(emptyEl) emptyEl.style.display='block';
    return;
  }

  if(wrapper) wrapper.style.display='block';
  if(emptyEl) emptyEl.style.display='none';

  itemsState.forEach(item=>{
    const tr=document.createElement('tr');
    const personnelType=item.condition||'GENERAL';

    const pillMap={
      AVAILABLE:{ cls:'VERIFIED', text:'AVAILABLE' },
      BORROWED:{ cls:'PENDING', text:'ACTIVE' },
      MAINTENANCE:{ cls:'TERMINATED', text:'UNDER REVIEW' },
      RESERVED:{ cls:'PENDING', text:'RESERVED' },
    };
    const pill=pillMap[item.status]||{ cls:'VERIFIED', text:item.status };
    const typeIcon=getPersonnelIcon(personnelType);

    const timestamp=item.created_at
      ?new Date(item.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })+' · TODAY'
      :'—';

    tr.innerHTML=`
      <td>
        <div class="entity-cell">
          <div class="entity-avatar-box">
            <i class="fas ${typeIcon}"></i>
            <div class="entity-red-dot"></div>
          </div>
          <div>
            <span class="entity-name">${escapeHtml(item.title.toUpperCase())}</span>
            <span class="entity-role">${escapeHtml(item.item_code)} // ${escapeHtml(personnelType.toUpperCase())}</span>
          </div>
        </div>
      </td>
      <td><span class="action-mono">${escapeHtml(personnelType.toUpperCase())}</span></td>
      <td><span class="timestamp-mono">${timestamp}</span></td>
      <td><span class="status-pill ${pill.cls}">${pill.text}</span></td>
      <td>
        <div class="actions-row">
          <button class="icon-btn" onclick="openEditModal(${item.id})" title="Edit">
            <i class="fas fa-pen"></i>
          </button>
          <button class="icon-btn" onclick="openDeleteModal(${item.id})" title="Delete">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getPersonnelIcon(type){
  const t=(type||'').toLowerCase();
  if(t.includes('head coach')) return 'fa-user-tie';
  if(t.includes('coach')) return 'fa-whistle';
  if(t.includes('player')) return 'fa-user-shield';
  return 'fa-shield';
}

function escapeHtml(text){
  if(!text) return '';
  return text.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openAddModal(){
  editingItemId=null;
  document.getElementById('modalTitle').textContent='ADD PERSONNEL';
  document.getElementById('itemForm').reset();

  const pt=document.getElementById('formPersonnelType');
  if(currentPage==='coach') pt.value='Coach';
  else if(currentPage==='players') pt.value='Player';
  else pt.value='';

  document.getElementById('formModal').classList.add('active');
}

function openEditModal(id){
  const item=itemsState.find(i=>i.id===id);
  if(!item) return;

  editingItemId=id;
  document.getElementById('modalTitle').textContent=`EDIT RECORD — ${item.item_code}`;
  document.getElementById('formTitle').value=item.title;
  document.getElementById('formPersonnelType').value=item.condition||'';
  document.getElementById('formStatus').value=item.status;
  document.getElementById('formNotes').value=item.notes||'';
  document.getElementById('formModal').classList.add('active');
}

function closeFormModal(){
  document.getElementById('formModal').classList.remove('active');
  editingItemId=null;
}

function openDeleteModal(id){
  const item=itemsState.find(i=>i.id===id);
  if(!item) return;
  deletingItemId=id;
  document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal(){
  document.getElementById('deleteModal').classList.remove('active');
  deletingItemId=null;
}

function debounce(func, wait){
  let timeout;
  return function(...args){
    clearTimeout(timeout);
    timeout=setTimeout(()=>func.apply(this, args), wait);
  };
}

function showToast(message, type='info'){
  const container=document.getElementById('toastContainer');
  if(!container) return;

  const toast=document.createElement('div');
  toast.className=`toast toast-${type}`;
  toast.textContent=message;
  container.appendChild(toast);

  setTimeout(()=>{
    toast.classList.add('show');
  }, 10);

  setTimeout(()=>{
    toast.classList.remove('show');
    setTimeout(()=>toast.remove(), 300);
  }, 3000);
}
