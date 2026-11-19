/**
 * VISOS KERATIN — SISTEMA CONTABLE, INVENTARIO, POS & GESTIÓN TRIBUTARIA DIAN
 * Versión 3.5:
 * - Inventario protegido (no se sobreescribe).
 * - Servicios editables (nombre, precio, duración y categoría).
 * - Herramienta para limpiar/eliminar datos de prueba manteniendo inventario.
 * - Impresión de ticket en tamaño térmico exacto (80mm).
 * - Envío por WhatsApp en formato de ticket de venta (sin caracteres rotos).
 */

// ==========================================================================
// 1. BASE DE DATOS INICIAL & PERSISTENCIA LOCAL
// ==========================================================================

const DB_KEY = 'VISOS_SALON_DB_V3';

function getTodayIso() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function formatMoney(amount) {
  const num = Number(amount) || 0;
  return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const SEED_DATA = {
  config: {
    salonName: 'VISOS KERATIN',
    slogan: '¡Donde tu cabello encuentra su mejor versión!',
    nit: '1095793030-1',
    phone: '+57 3166390429',
    adminPhone: '+57 3166390429',
    defaultMargin: 50,
    address: 'Mna B casa 38, Miraflores',
    currency: '$',
    invoiceFooter: '¡Gracias por tu visita a Visos Keratin!.',
    invoicePrefix: 'VK-',
    nextInvoiceNumber: 120,
    firebaseUrl: 'https://visos-keratin-default-rtdb.firebaseio.com'
  },
  stylists: [
    { id: 'e1', name: 'Leidy', role: 'Administradora & Máster', serviceCommPercent: 50, productCommPercent: 10, initials: 'LE' },
    { id: 'e2', name: 'Andrea Gómez', role: 'Estilista Profesional', serviceCommPercent: 45, productCommPercent: 10, initials: 'AG' },
    { id: 'e3', name: 'Camila Rojas', role: 'Manicurista & Colorista', serviceCommPercent: 40, productCommPercent: 10, initials: 'CR' }
  ],
  services: [
    { id: 'svc-kera', name: 'Keratina Alisado Brasileño', category: 'keratinas', price: 180000, duration: 150, description: 'Alisado progresivo con brillo espejo' },
    { id: 'svc-corte', name: 'Corte de Cabello', category: 'servicios', price: 30000, duration: 45, description: 'Corte de puntas, capas o cambio de look' },
    { id: 'svc-tinte', name: 'Tinte / Color Global', category: 'servicios', price: 120000, duration: 120, description: 'Coloración con protección Plex' },
    { id: 'svc-brush', name: 'Peinado / Brushing', category: 'servicios', price: 35000, duration: 60, description: 'Lavado especial + cepillado y ondas' },
    { id: 'svc-mani', name: 'Manicure & Pedicure Spa', category: 'servicios', price: 35000, duration: 75, description: 'Limpieza profunda, exfoliación y esmaltado' },
    { id: 'svc-trat', name: 'Tratamiento Capilar Profundo', category: 'servicios', price: 60000, duration: 90, description: 'Repolarización intensiva' },
    { id: 'svc-hidra', name: 'Hidratación & Botox', category: 'servicios', price: 45000, duration: 60, description: 'Anti-frizz con ácido hialurónico' },
    { id: 'svc-repo', name: 'Repo Capilar', category: 'servicios', price: 70000, duration: 90, description: 'Recuperación de hebra quebradiza' },
    { id: 'svc-pisado', name: 'Pisado Especial', category: 'servicios', price: 50000, duration: 60, description: 'Sellado de cutícula con calor' },
    { id: 'svc-plancha', name: 'Planchado Láser', category: 'servicios', price: 25000, duration: 45, description: 'Sellado y planchado térmico' },
    { id: 'svc-cejas', name: 'Diseño de Cejas & Bozo', category: 'servicios', price: 20000, duration: 30, description: 'Depilación con cera o hilo' }
  ],
  products: [
    { id: 'prd-sh-post', sku: 'VK-SH01', name: 'Shampoo Post-Keratina Sin Sal 500ml', type: 'retail', category: 'shampoos', stock: 16, minStock: 4, cost: 20000, price: 45000 },
    { id: 'prd-masc-rep', sku: 'VK-MS02', name: 'Mascarilla Reparadora Brillo Extremo 300g', type: 'retail', category: 'shampoos', stock: 12, minStock: 3, cost: 24000, price: 55000 },
    { id: 'prd-argan', sku: 'VK-AR03', name: 'Serum Aceite de Argán & Seda 60ml', type: 'retail', category: 'tratamientos', stock: 9, minStock: 3, cost: 16000, price: 38000 },
    { id: 'prd-termo', sku: 'VK-TP04', name: 'Termoprotector en Spray 250ml', type: 'retail', category: 'shampoos', stock: 14, minStock: 5, cost: 15000, price: 35000 },
    { id: 'prd-kit-home', sku: 'VK-KT05', name: 'Kit Mantenimiento Completo en Casa', type: 'retail', category: 'keratinas', stock: 5, minStock: 2, cost: 42000, price: 95000 },
    { id: 'prd-kera-litro', sku: 'VK-KB10', name: 'Keratina Litro Uso Profesional (Cabina)', type: 'cabina', category: 'keratinas', stock: 4, minStock: 2, cost: 110000, price: 250000 },
    { id: 'prd-tinte-tubo', sku: 'VK-TT20', name: 'Tinte Profesional 60g Tonos Varios', type: 'cabina', category: 'tintes', stock: 24, minStock: 8, cost: 12000, price: 28000 },
    { id: 'prd-oxi-litro', sku: 'VK-OX30', name: 'Oxidante 20 Volúmenes 1000ml', type: 'cabina', category: 'tintes', stock: 6, minStock: 2, cost: 14000, price: 30000 },
    { id: 'prd-cepillo-term', sku: 'VK-CP40', name: 'Cepillo Térmico Cerámico Iónico', type: 'retail', category: 'accesorios', stock: 7, minStock: 2, cost: 18000, price: 40000 }
  ],
  inventoryMovements: [],
  appointments: [],
  invoices: [],
  supplierInvoices: [],
  expenses: [],
  cashRegister: {
    isOpen: true,
    openedAt: new Date().toISOString(),
    baseCash: 150000
  }
};

// Cargar o inicializar estado protegiendo estrictamente el inventario y configuración del usuario
let appState = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);

      // 1. Conservar estrictamente los productos que el usuario ya actualizó
      const preservedProducts = (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0)
        ? parsed.products
        : SEED_DATA.products;

      // 2. Conservar los servicios que el usuario edite o agregue
      const preservedServices = (parsed.services && Array.isArray(parsed.services) && parsed.services.length > 0)
        ? parsed.services
        : SEED_DATA.services;

      // 3. Conservar la configuración del salón (NIT, dirección, etc.)
      const preservedConfig = parsed.config ? { ...SEED_DATA.config, ...parsed.config } : SEED_DATA.config;

      // 4. Conservar estilistas
      const preservedStylists = (parsed.stylists && Array.isArray(parsed.stylists) && parsed.stylists.length > 0)
        ? parsed.stylists
        : SEED_DATA.stylists;

      // 5. Facturas de proveedores
      const preservedSupplierInvoices = (parsed.supplierInvoices && Array.isArray(parsed.supplierInvoices))
        ? parsed.supplierInvoices
        : [];

      // 6. Normalizar facturas para soporte de créditos y abonos de clientas
      const normalizedInvoices = (parsed.invoices || []).map(inv => {
        const total = Number(inv.total) || 0;
        const paidAmount = inv.paidAmount !== undefined ? Number(inv.paidAmount) : total;
        const balanceDue = inv.balanceDue !== undefined ? Number(inv.balanceDue) : Math.max(0, total - paidAmount);
        const payments = Array.isArray(inv.payments) && inv.payments.length > 0
          ? inv.payments
          : [{ id: 'pay-' + inv.id, date: inv.date, amount: paidAmount, method: inv.paymentMethod || 'efectivo', note: 'Pago inicial' }];
        return {
          ...inv,
          paidAmount,
          balanceDue,
          paymentTerm: inv.paymentTerm || (balanceDue > 0 ? 'credito' : 'contado'),
          status: balanceDue > 0 ? 'pendiente' : 'pagada',
          payments
        };
      });

      return {
        ...SEED_DATA,
        ...parsed,
        products: preservedProducts,
        services: preservedServices,
        config: preservedConfig,
        stylists: preservedStylists,
        supplierInvoices: preservedSupplierInvoices,
        invoices: normalizedInvoices
      };
    }
  } catch (e) {
    console.error('Error cargando base de datos:', e);
  }
  return JSON.parse(JSON.stringify(SEED_DATA));
}

function saveState(dataToSave = appState) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(dataToSave));
    // Sincronización automática con Firebase RTDB (Visos Keratin) en segundo plano
    if (typeof scheduleCloudSync === 'function') {
      scheduleCloudSync();
    }
  } catch (e) {
    console.error('Error guardando en LocalStorage:', e);
    showToast('Error al guardar datos locales', 'error');
  }
}

// ==========================================================================
// 2. ESTADO DEL CARRITO / CUENTA ACTUAL (POS)
// ==========================================================================

let cart = {
  items: [],
  clientId: null,
  clientName: '',
  clientPhone: '',
  appointmentId: null,
  stylistId: 'e1',
  discountType: 'percent',
  discountValue: 0
};

// ==========================================================================
// 3. INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initLucide();
  initNavigation();
  initTopBar();
  initPOS();
  initAgenda();
  initInventory();
  initInvoices();
  initCashRegister();
  initCommissions();
  initClientStats();
  initFiscalModule();
  initReports();
  initServicesModule();
  initCleanDataModule();
  initCloudSyncService();
  initSupplierInvoiceModule();
  initDebtorsModule();
  initConfig();

  // Render inicial de datos
  updateQuickCajaBadge();
  renderPOSCatalog();
  renderPOSCart();
  renderAgendaList();
  renderInventoryTable();
  renderSupplierInvoicesTable();
  renderDebtorsTable();
  renderInvoicesTable();
  renderExpensesTable();
  renderCommissionsView();
  renderClientStatsView();
  renderFiscalView();
  renderReportsView();
  renderStylistsConfig();
  renderConfigServicesTable();
  populateServiceSelects();

  updateDateDisplay();
});

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function updateDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const str = new Date().toLocaleDateString('es-ES', options);
  const el = document.getElementById('currentDateStr');
  if (el) el.textContent = str.charAt(0).toUpperCase() + str.slice(1);
}

// ==========================================================================
// 4. NAVEGACIÓN ENTRE PESTAÑAS
// ==========================================================================

function initNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const panes = document.querySelectorAll('.tab-pane');
  const sidebar = document.getElementById('sidebar');
  const btnToggleSidebar = document.getElementById('btnToggleSidebar');
  const btnCloseSidebar = document.getElementById('btnCloseSidebar');
  const pageTitle = document.getElementById('pageTitle');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');

      navItems.forEach(n => n.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const targetPane = document.getElementById(tabId);
      if (targetPane) targetPane.classList.add('active');

      const span = item.querySelector('span');
      if (pageTitle && span) pageTitle.textContent = span.textContent;

      if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove('active');
      }

      handleTabSwitch(tabId);
      initLucide();
    });
  });

  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  if (btnCloseSidebar) {
    btnCloseSidebar.addEventListener('click', () => {
      sidebar.classList.remove('active');
    });
  }
}

function handleTabSwitch(tabId) {
  if (tabId === 'tab-agenda') renderAgendaList();
  if (tabId === 'tab-inventario') renderInventoryTable();
  if (tabId === 'tab-facturas') renderInvoicesTable();
  if (tabId === 'tab-caja') renderCashRegisterView();
  if (tabId === 'tab-comisiones') renderCommissionsView();
  if (tabId === 'tab-clientas') renderClientStatsView();
  if (tabId === 'tab-fiscal') renderFiscalView();
  if (tabId === 'tab-reportes') renderReportsView();
  if (tabId === 'tab-pos') renderPOSCatalog();
  if (tabId === 'tab-config') renderConfigServicesTable();
}

function initTopBar() {
  const btnNewSaleQuick = document.getElementById('btnNewSaleQuick');
  if (btnNewSaleQuick) {
    btnNewSaleQuick.addEventListener('click', () => {
      clearPOSCart();
      switchTab('tab-pos');
      showToast('Nueva cuenta iniciada', 'info');
    });
  }

  const btnSyncAppointments = document.getElementById('btnSyncAppointments');
  if (btnSyncAppointments) {
    btnSyncAppointments.addEventListener('click', syncAppointmentsFromVisos);
  }

  const btnQuickCajaToggle = document.getElementById('btnQuickCajaToggle');
  if (btnQuickCajaToggle) {
    btnQuickCajaToggle.addEventListener('click', () => {
      switchTab('tab-caja');
    });
  }

  const btnTopClean = document.getElementById('btnOpenCleanDataModal');
  if (btnTopClean) {
    btnTopClean.addEventListener('click', openCleanDataModal);
  }
}

function switchTab(tabId) {
  const navItem = document.querySelector(`.sidebar-nav .nav-item[data-tab="${tabId}"]`);
  if (navItem) navItem.click();
}

// ==========================================================================
// 5. GESTIÓN DE SERVICIOS EDITABLES (NOMBRES & PRECIOS)
// ==========================================================================

function initServicesModule() {
  const btnManageSvc = document.getElementById('btnOpenServiceManagerModal');
  const btnAddConfigSvc = document.getElementById('btnAddNewServiceConfig');
  const form = document.getElementById('serviceForm');
  const btnClose = document.getElementById('btnCloseServiceModal');
  const btnCancel = document.getElementById('btnCancelServiceModal');

  if (btnManageSvc) {
    btnManageSvc.addEventListener('click', () => openServiceModal(null));
  }

  if (btnAddConfigSvc) {
    btnAddConfigSvc.addEventListener('click', () => openServiceModal(null));
  }

  if (btnClose) btnClose.addEventListener('click', closeServiceModal);
  if (btnCancel) btnCancel.addEventListener('click', closeServiceModal);

  if (form) {
    form.addEventListener('submit', saveService);
  }
}

window.openServiceModal = function(serviceId = null) {
  const modal = document.getElementById('serviceModal');
  const form = document.getElementById('serviceForm');
  const title = document.getElementById('serviceModalTitle');

  form.reset();
  document.getElementById('svcEditId').value = '';

  if (serviceId) {
    const svc = appState.services.find(s => s.id === serviceId);
    if (!svc) return;

    title.textContent = 'Editar Servicio y Precio';
    document.getElementById('svcEditId').value = svc.id;
    document.getElementById('svcName').value = svc.name;
    document.getElementById('svcPrice').value = svc.price;
    document.getElementById('svcDuration').value = svc.duration || 60;
    document.getElementById('svcCategory').value = svc.category || 'servicios';
  } else {
    title.textContent = 'Agregar Nuevo Servicio';
    document.getElementById('svcDuration').value = 60;
  }

  modal.classList.add('active');
};

function closeServiceModal() {
  const modal = document.getElementById('serviceModal');
  if (modal) modal.classList.remove('active');
}

function saveService(e) {
  e.preventDefault();

  const editId = document.getElementById('svcEditId').value;
  const name = document.getElementById('svcName').value.trim();
  const price = Number(document.getElementById('svcPrice').value) || 0;
  const duration = Number(document.getElementById('svcDuration').value) || 60;
  const category = document.getElementById('svcCategory').value;

  if (!name) {
    showToast('El nombre del servicio es obligatorio', 'warning');
    return;
  }

  if (editId) {
    const svc = appState.services.find(s => s.id === editId);
    if (svc) {
      svc.name = name;
      svc.price = price;
      svc.duration = duration;
      svc.category = category;
      showToast(`Servicio "${name}" actualizado con éxito`, 'success');
    }
  } else {
    const newId = 'svc-' + Date.now();
    appState.services.push({
      id: newId,
      name,
      price,
      duration,
      category,
      description: 'Servicio registrado en salón'
    });
    showToast(`Nuevo servicio "${name}" creado`, 'success');
  }

  saveState();
  closeServiceModal();
  renderPOSCatalog();
  renderConfigServicesTable();
  populateServiceSelects();
}

window.deleteService = function(serviceId) {
  const svc = appState.services.find(s => s.id === serviceId);
  if (!svc) return;

  if (confirm(`¿Eliminar definitivamente el servicio "${svc.name}"?`)) {
    appState.services = appState.services.filter(s => s.id !== serviceId);
    saveState();
    renderPOSCatalog();
    renderConfigServicesTable();
    populateServiceSelects();
    showToast(`Servicio "${svc.name}" eliminado`, 'info');
  }
};

function renderConfigServicesTable() {
  const tbody = document.getElementById('configServicesTableBody');
  if (!tbody) return;

  if (!appState.services || appState.services.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No hay servicios registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.services.map(s => `
    <tr>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td><span style="font-size:11px; text-transform:capitalize;">${escapeHtml(s.category)}</span></td>
      <td class="text-right"><strong style="color:var(--gold);">${formatMoney(s.price)}</strong></td>
      <td class="text-center">${s.duration} mins</td>
      <td class="text-center">
        <div class="table-row-actions">
          <button class="btn-tbl-action" onclick="openServiceModal('${s.id}')" title="Editar">✏️ Editar</button>
          <button class="btn-tbl-action" onclick="deleteService('${s.id}')" title="Eliminar" style="color:var(--rose);">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function populateServiceSelects() {
  const select = document.getElementById('aptServiceSelect');
  if (select && appState.services) {
    select.innerHTML = appState.services.map(s => `
      <option value="${s.id}">${s.name} (${formatMoney(s.price)})</option>
    `).join('');
  }
}

// ==========================================================================
// 6. LIMPIEZA DE DATOS DE PRUEBA (MANTENIENDO INVENTARIO)
// ==========================================================================

function initCleanDataModule() {
  const btnClose = document.getElementById('btnCloseCleanDataModal');
  const btnCancel = document.getElementById('btnCancelCleanDataModal');
  const btnCleanInvoices = document.getElementById('btnCleanInvoicesOnly');
  const btnCleanApts = document.getElementById('btnCleanAppointmentsOnly');
  const btnCleanAll = document.getElementById('btnCleanAllDummyData');

  const btnModalInvoices = document.getElementById('btnModalCleanInvoices');
  const btnModalApts = document.getElementById('btnModalCleanAppointments');
  const btnModalAll = document.getElementById('btnModalCleanAll');

  if (btnClose) btnClose.addEventListener('click', closeCleanDataModal);
  if (btnCancel) btnCancel.addEventListener('click', closeCleanDataModal);

  if (btnCleanInvoices) btnCleanInvoices.addEventListener('click', () => cleanDataAction('invoices'));
  if (btnCleanApts) btnCleanApts.addEventListener('click', () => cleanDataAction('appointments'));
  if (btnCleanAll) btnCleanAll.addEventListener('click', () => cleanDataAction('all'));

  if (btnModalInvoices) btnModalInvoices.addEventListener('click', () => cleanDataAction('invoices'));
  if (btnModalApts) btnModalApts.addEventListener('click', () => cleanDataAction('appointments'));
  if (btnModalAll) btnModalAll.addEventListener('click', () => cleanDataAction('all'));
}

window.openCleanDataModal = function() {
  const modal = document.getElementById('cleanDataModal');
  if (modal) modal.classList.add('active');
};

function closeCleanDataModal() {
  const modal = document.getElementById('cleanDataModal');
  if (modal) modal.classList.remove('active');
}

function cleanDataAction(type) {
  if (type === 'invoices') {
    if (confirm('¿Deseas eliminar todas las facturas y ventas de prueba? (Tu inventario y servicios se mantendrán intactos)')) {
      appState.invoices = [];
      appState.config.nextInvoiceNumber = 1;
      saveState();
      refreshAllDataViews();
      closeCleanDataModal();
      showToast('Facturas de prueba eliminadas. El contador iniciará en #1.', 'success');
    }
  } else if (type === 'appointments') {
    if (confirm('¿Deseas limpiar las citas de prueba de la agenda? (Tu inventario se mantendrá intacto)')) {
      appState.appointments = [];
      saveState();
      refreshAllDataViews();
      closeCleanDataModal();
      showToast('Citas de ejemplo eliminadas.', 'success');
    }
  } else if (type === 'all') {
    if (confirm('¿Estás segura de borrar TODO el historial de prueba (facturas, citas y gastos de ejemplo)?\n\n✅ IMPORTANTE: Tu inventario de productos actualizado y tus servicios NO se borrarán.')) {
      appState.invoices = [];
      appState.appointments = [];
      appState.expenses = [];
      appState.inventoryMovements = [];
      appState.config.nextInvoiceNumber = 1;
      saveState();
      refreshAllDataViews();
      closeCleanDataModal();
      showToast('¡Historial de prueba limpiado! El sistema está listo para registrar tus ventas reales.', 'success');
    }
  }
}

function refreshAllDataViews() {
  updateQuickCajaBadge();
  renderInvoicesTable();
  renderDebtorsTable();
  renderSupplierInvoicesTable();
  renderAgendaList();
  renderExpensesTable();
  renderCashRegisterView();
  renderCommissionsView();
  renderClientStatsView();
  renderFiscalView();
  renderReportsView();
}

// ==========================================================================
// 7. MÓDULO PUNTO DE VENTA (POS)
// ==========================================================================

let posCategoryFilter = 'all';
let posSearchQuery = '';

function initPOS() {
  const searchInput = document.getElementById('posSearchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const catPills = document.querySelectorAll('#posCategoryTabs .cat-pill');
  const btnClearCart = document.getElementById('btnClearCart');
  const posClientName = document.getElementById('posClientName');
  const posStylistSelect = document.getElementById('posStylistSelect');
  const btnPickClient = document.getElementById('btnPickClientFromAgenda');
  const btnRemoveClientBanner = document.getElementById('btnRemoveClientBanner');
  const btnToggleDiscount = document.getElementById('btnToggleDiscount');
  const discountInputRow = document.getElementById('discountInputRow');
  const posDiscountVal = document.getElementById('posDiscountVal');
  const posDiscountType = document.getElementById('posDiscountType');
  const btnOpenCheckout = document.getElementById('btnOpenCheckout');

  populateStylistSelects();

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      posSearchQuery = e.target.value.toLowerCase().trim();
      if (btnClearSearch) btnClearSearch.style.display = posSearchQuery ? 'block' : 'none';
      renderPOSCatalog();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      posSearchQuery = '';
      btnClearSearch.style.display = 'none';
      renderPOSCatalog();
    });
  }

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      posCategoryFilter = pill.getAttribute('data-category');
      renderPOSCatalog();
    });
  });

  if (btnClearCart) {
    btnClearCart.addEventListener('click', () => {
      if (cart.items.length === 0) return;
      if (confirm('¿Vaciar la cuenta actual?')) {
        clearPOSCart();
      }
    });
  }

  if (posClientName) {
    posClientName.addEventListener('input', (e) => {
      cart.clientName = e.target.value;
    });
  }

  if (posStylistSelect) {
    posStylistSelect.addEventListener('change', (e) => {
      cart.stylistId = e.target.value;
    });
  }

  if (btnPickClient) {
    btnPickClient.addEventListener('click', () => {
      switchTab('tab-agenda');
      showToast('Selecciona una clienta tocando "Cobrar"', 'info');
    });
  }

  if (btnRemoveClientBanner) {
    btnRemoveClientBanner.addEventListener('click', () => {
      cart.appointmentId = null;
      document.getElementById('posClientBanner').style.display = 'none';
      document.getElementById('posClientName').value = '';
      cart.clientName = '';
      cart.clientPhone = '';
    });
  }

  if (btnToggleDiscount) {
    btnToggleDiscount.addEventListener('click', () => {
      const isHidden = discountInputRow.style.display === 'none';
      discountInputRow.style.display = isHidden ? 'block' : 'none';
    });
  }

  if (posDiscountVal) {
    posDiscountVal.addEventListener('input', (e) => {
      cart.discountValue = Math.max(0, Number(e.target.value) || 0);
      renderPOSCart();
    });
  }

  if (posDiscountType) {
    posDiscountType.addEventListener('change', (e) => {
      cart.discountType = e.target.value;
      renderPOSCart();
    });
  }

  if (btnOpenCheckout) {
    btnOpenCheckout.addEventListener('click', openCheckoutModal);
  }

  initCheckoutModal();
  initReceiptModal();
}

function populateStylistSelects() {
  const selects = [
    document.getElementById('posStylistSelect'),
    document.getElementById('aptStylistSelect')
  ];

  selects.forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">Seleccionar Estilista...</option>' +
      appState.stylists.map(s => `<option value="${s.id}">${s.name} (${s.role})</option>`).join('');
  });

  if (document.getElementById('posStylistSelect')) {
    document.getElementById('posStylistSelect').value = 'e1';
    cart.stylistId = 'e1';
  }
}

function renderPOSCatalog() {
  const grid = document.getElementById('posItemsGrid');
  if (!grid) return;

  const items = [];

  // Agregar Servicios
  appState.services.forEach(s => {
    items.push({
      id: s.id,
      name: s.name,
      type: 'service',
      category: s.category || 'servicios',
      price: s.price,
      cost: 0,
      stock: null,
      meta: `${s.duration || 60} mins • Servicio`
    });
  });

  // Agregar Productos (Inventario)
  appState.products.forEach(p => {
    items.push({
      id: p.id,
      name: p.name,
      type: 'product',
      category: p.category,
      price: p.price,
      cost: p.cost,
      stock: p.stock,
      minStock: p.minStock,
      meta: `Stock: ${p.stock} unid.`
    });
  });

  const filtered = items.filter(item => {
    if (posCategoryFilter === 'servicios' && item.type !== 'service') return false;
    if (posCategoryFilter === 'retail' && item.type !== 'product') return false;
    if (posCategoryFilter === 'keratinas' && item.category !== 'keratinas') return false;
    if (posCategoryFilter === 'shampoos' && item.category !== 'shampoos') return false;

    if (posSearchQuery) {
      const matchName = item.name.toLowerCase().includes(posSearchQuery);
      const matchMeta = item.meta.toLowerCase().includes(posSearchQuery);
      if (!matchName && !matchMeta) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p>No se encontraron servicios o productos con ese criterio.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    let stockBadgeHtml = '';
    let isOutOfStock = false;

    if (item.type === 'product') {
      if (item.stock <= 0) {
        stockBadgeHtml = `<span class="item-stock-badge stock-out">Agotado</span>`;
        isOutOfStock = true;
      } else if (item.stock <= item.minStock) {
        stockBadgeHtml = `<span class="item-stock-badge stock-low">Bajo: ${item.stock}</span>`;
      } else {
        stockBadgeHtml = `<span class="item-stock-badge stock-ok">Stock: ${item.stock}</span>`;
      }
    }

    return `
      <div class="pos-item-card ${isOutOfStock ? 'out-of-stock' : ''}" onclick="addItemToCart('${item.id}', '${item.type}')">
        ${item.type === 'service' ? `
          <button class="btn-edit-item-quick" onclick="event.stopPropagation(); openServiceModal('${item.id}')" title="Editar Nombre / Precio">
            ✏️
          </button>
        ` : ''}

        <span class="item-badge-type ${item.type === 'service' ? 'badge-service' : 'badge-retail'}">
          ${item.type === 'service' ? '✂️ Servicio' : '🛍️ Producto'}
        </span>
        <h4 class="item-name">${escapeHtml(item.name)}</h4>
        <span class="item-meta">${item.meta}</span>
        <div class="item-footer">
          <span class="item-price">${formatMoney(item.price)}</span>
          ${stockBadgeHtml}
        </div>
      </div>
    `;
  }).join('');
}

window.addItemToCart = function(itemId, itemType) {
  let sourceItem = itemType === 'service'
    ? appState.services.find(s => s.id === itemId)
    : appState.products.find(p => p.id === itemId);

  if (!sourceItem) return;

  if (itemType === 'product') {
    const existingInCart = cart.items.find(i => i.id === itemId);
    const currentCartQty = existingInCart ? existingInCart.qty : 0;

    if (currentCartQty + 1 > sourceItem.stock) {
      showToast(`¡Stock insuficiente! Solo quedan ${sourceItem.stock} unidades de este producto.`, 'warning');
      return;
    }
  }

  const existing = cart.items.find(i => i.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.items.push({
      id: sourceItem.id,
      name: sourceItem.name,
      type: itemType,
      price: sourceItem.price,
      cost: sourceItem.cost || 0,
      qty: 1,
      stylistId: cart.stylistId || 'e1'
    });
  }

  renderPOSCart();
};

function renderPOSCart() {
  const container = document.getElementById('ticketItemsList');
  const subtotalEl = document.getElementById('posSubtotal');
  const discountEl = document.getElementById('posDiscountAmount');
  const totalEl = document.getElementById('posTotalAmount');
  const btnCheckoutTotal = document.getElementById('btnCheckoutTotal');
  const btnOpenCheckout = document.getElementById('btnOpenCheckout');
  const cartBadge = document.getElementById('cartBadge');

  if (!container) return;

  if (cart.items.length === 0) {
    container.innerHTML = `
      <div class="ticket-empty">
        <i data-lucide="sparkles" class="empty-icon"></i>
        <p>Selecciona servicios o productos del catálogo para comenzar la cuenta.</p>
      </div>
    `;
    subtotalEl.textContent = formatMoney(0);
    discountEl.textContent = `-${formatMoney(0)}`;
    totalEl.textContent = formatMoney(0);
    if (btnCheckoutTotal) btnCheckoutTotal.textContent = formatMoney(0);
    if (btnOpenCheckout) btnOpenCheckout.disabled = true;
    if (cartBadge) cartBadge.style.display = 'none';
    initLucide();
    return;
  }

  if (btnOpenCheckout) btnOpenCheckout.disabled = false;

  const totalCount = cart.items.reduce((acc, i) => acc + i.qty, 0);
  if (cartBadge) {
    cartBadge.textContent = totalCount;
    cartBadge.style.display = 'inline-block';
  }

  container.innerHTML = cart.items.map((item, idx) => {
    const subtotalItem = item.price * item.qty;
    return `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <span class="cart-item-name">${escapeHtml(item.name)}</span>
          <span class="cart-item-unit-price">${item.type === 'service' ? '✂️' : '🛍️'} ${formatMoney(item.price)} c/u</span>
        </div>
        <div class="cart-qty-ctrl">
          <button class="btn-qty" onclick="changeCartQty(${idx}, -1)">-</button>
          <span class="cart-qty-val">${item.qty}</span>
          <button class="btn-qty" onclick="changeCartQty(${idx}, 1)">+</button>
        </div>
        <span class="cart-item-subtotal">${formatMoney(subtotalItem)}</span>
        <button class="btn-del-cart-item" onclick="removeCartItem(${idx})" title="Eliminar">
          <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
        </button>
      </div>
    `;
  }).join('');

  const subtotal = cart.items.reduce((acc, i) => acc + (i.price * i.qty), 0);
  let discountAmount = 0;

  if (cart.discountValue > 0) {
    if (cart.discountType === 'percent') {
      discountAmount = Math.round(subtotal * (cart.discountValue / 100));
    } else {
      discountAmount = Math.min(subtotal, cart.discountValue);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  subtotalEl.textContent = formatMoney(subtotal);
  discountEl.textContent = `-${formatMoney(discountAmount)}`;
  totalEl.textContent = formatMoney(finalTotal);
  if (btnCheckoutTotal) btnCheckoutTotal.textContent = formatMoney(finalTotal);

  initLucide();
}

window.changeCartQty = function(index, delta) {
  const item = cart.items[index];
  if (!item) return;

  const newQty = item.qty + delta;

  if (newQty <= 0) {
    cart.items.splice(index, 1);
  } else {
    if (item.type === 'product') {
      const prod = appState.products.find(p => p.id === item.id);
      if (prod && newQty > prod.stock) {
        showToast(`Stock máximo alcanzado (${prod.stock} disponibles)`, 'warning');
        return;
      }
    }
    item.qty = newQty;
  }
  renderPOSCart();
};

window.removeCartItem = function(index) {
  cart.items.splice(index, 1);
  renderPOSCart();
};

function clearPOSCart() {
  cart.items = [];
  cart.clientId = null;
  cart.clientName = '';
  cart.clientPhone = '';
  cart.appointmentId = null;
  cart.discountValue = 0;

  const inputName = document.getElementById('posClientName');
  if (inputName) inputName.value = '';

  const banner = document.getElementById('posClientBanner');
  if (banner) banner.style.display = 'none';

  const discInput = document.getElementById('posDiscountVal');
  if (discInput) discInput.value = '';

  const discRow = document.getElementById('discountInputRow');
  if (discRow) discRow.style.display = 'none';

  renderPOSCart();
}

// ==========================================================================
// 8. CHECKOUT & FACTURACIÓN
// ==========================================================================

let checkoutPaymentMethod = 'efectivo';
let checkoutPaymentTerm = 'contado';
let lastCompletedInvoice = null;

function initCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  const btnClose = document.getElementById('btnCloseCheckout');
  const btnCancel = document.getElementById('btnCancelCheckout');
  const btnConfirm = document.getElementById('btnProcessPayment');
  const methodBtns = document.querySelectorAll('.payment-methods-select .pay-method-btn');
  const cashReceivedInput = document.getElementById('cashReceivedInput');
  const cashPills = document.querySelectorAll('.quick-cash-pills .pill-cash');
  const termBtns = document.querySelectorAll('.pay-term-btn');
  const creditDepositInput = document.getElementById('creditDepositInput');

  if (btnClose) btnClose.addEventListener('click', closeCheckoutModal);
  if (btnCancel) btnCancel.addEventListener('click', closeCheckoutModal);

  // Selector de condición de venta: Contado vs Crédito
  termBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      termBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      checkoutPaymentTerm = btn.getAttribute('data-term') || 'contado';

      const creditBox = document.getElementById('creditInputBox');
      const cashBox = document.getElementById('cashCalcBox');
      const alertBox = document.getElementById('creditAlertClientRequired');
      if (alertBox) alertBox.style.display = 'none';

      if (checkoutPaymentTerm === 'credito') {
        if (creditBox) creditBox.style.display = 'block';
        updateCreditBalanceDisplay();
      } else {
        if (creditBox) creditBox.style.display = 'none';
        if (cashBox) cashBox.style.display = checkoutPaymentMethod === 'efectivo' ? 'block' : 'none';
      }
    });
  });

  if (creditDepositInput) {
    creditDepositInput.addEventListener('input', updateCreditBalanceDisplay);
  }

  methodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      methodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      checkoutPaymentMethod = btn.getAttribute('data-method');

      const cashBox = document.getElementById('cashCalcBox');
      const splitBox = document.getElementById('splitPayBox');

      if (cashBox) cashBox.style.display = (checkoutPaymentMethod === 'efectivo' && checkoutPaymentTerm !== 'credito') ? 'block' : 'none';
      if (splitBox) splitBox.style.display = checkoutPaymentMethod === 'mixto' ? 'block' : 'none';
    });
  });

  if (cashReceivedInput) {
    cashReceivedInput.addEventListener('input', calculateCashChange);
  }

  cashPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const isExact = pill.getAttribute('data-exact') === 'true';
      const addVal = Number(pill.getAttribute('data-add')) || 0;
      const total = calculateCartTotal();

      if (isExact) {
        cashReceivedInput.value = total;
      } else {
        const cur = Number(cashReceivedInput.value) || 0;
        cashReceivedInput.value = cur + addVal;
      }
      calculateCashChange();
    });
  });

  if (btnConfirm) {
    btnConfirm.addEventListener('click', processPaymentAndInvoice);
  }
}

function updateCreditBalanceDisplay() {
  const total = calculateCartTotal();
  const depositInput = document.getElementById('creditDepositInput');
  const deposit = Number(depositInput ? depositInput.value : 0) || 0;
  const balanceDue = Math.max(0, total - deposit);
  const display = document.getElementById('creditBalanceDueVal');
  if (display) display.textContent = formatMoney(balanceDue);
}

function calculateCartTotal() {
  const subtotal = cart.items.reduce((acc, i) => acc + (i.price * i.qty), 0);
  let discountAmount = 0;
  if (cart.discountValue > 0) {
    if (cart.discountType === 'percent') {
      discountAmount = Math.round(subtotal * (cart.discountValue / 100));
    } else {
      discountAmount = Math.min(subtotal, cart.discountValue);
    }
  }
  return Math.max(0, subtotal - discountAmount);
}

function openCheckoutModal() {
  if (cart.items.length === 0) {
    showToast('La cuenta está vacía', 'warning');
    return;
  }

  const modal = document.getElementById('checkoutModal');
  const total = calculateCartTotal();

  const clientName = document.getElementById('posClientName').value.trim() || 'Clienta General';
  cart.clientName = clientName;

  const stylistSelect = document.getElementById('posStylistSelect');
  const stylistObj = appState.stylists.find(s => s.id === (stylistSelect.value || cart.stylistId));
  const stylistName = stylistObj ? stylistObj.name : 'Leidy';

  document.getElementById('chkSummaryClient').textContent = clientName;
  document.getElementById('chkSummaryStylist').textContent = stylistName;
  document.getElementById('chkSummaryTotal').textContent = formatMoney(total);

  // Reset condición de venta a Contado por defecto
  checkoutPaymentTerm = 'contado';
  const termBtns = document.querySelectorAll('.pay-term-btn');
  termBtns.forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-term') === 'contado');
  });
  const creditBox = document.getElementById('creditInputBox');
  if (creditBox) creditBox.style.display = 'none';
  const alertBox = document.getElementById('creditAlertClientRequired');
  if (alertBox) alertBox.style.display = 'none';

  const depositInput = document.getElementById('creditDepositInput');
  if (depositInput) depositInput.value = 0;

  const dueDateInput = document.getElementById('creditDueDateInput');
  if (dueDateInput) {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    dueDateInput.value = d.toISOString().split('T')[0];
  }

  const cashInput = document.getElementById('cashReceivedInput');
  cashInput.value = total;
  calculateCashChange();

  modal.classList.add('active');
  initLucide();
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  modal.classList.remove('active');
}

function calculateCashChange() {
  const total = calculateCartTotal();
  const received = Number(document.getElementById('cashReceivedInput').value) || 0;
  const change = Math.max(0, received - total);
  const changeEl = document.getElementById('cashChangeVal');
  if (changeEl) changeEl.textContent = formatMoney(change);
}

function processPaymentAndInvoice() {
  const total = calculateCartTotal();
  const subtotal = cart.items.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const discount = Math.max(0, subtotal - total);

  const clientName = cart.clientName || 'Clienta General';
  const clientPhone = cart.clientPhone || document.getElementById('posClientPhone')?.value?.trim() || '';
  const stylistSelect = document.getElementById('posStylistSelect');
  const stylistId = stylistSelect.value || cart.stylistId || 'e1';
  const stylistObj = appState.stylists.find(s => s.id === stylistId);
  const stylistName = stylistObj ? stylistObj.name : 'Leidy';

  // Manejo de Crédito vs Contado
  let paidAmount = total;
  let balanceDue = 0;
  let dueDate = '';
  let payments = [];

  if (checkoutPaymentTerm === 'credito') {
    const depositInput = document.getElementById('creditDepositInput');
    const deposit = Math.max(0, Math.min(total, Number(depositInput ? depositInput.value : 0) || 0));
    const dueDateInput = document.getElementById('creditDueDateInput');
    dueDate = dueDateInput ? dueDateInput.value : '';

    if (!clientName || clientName === 'Clienta General' || !clientPhone) {
      const alertBox = document.getElementById('creditAlertClientRequired');
      if (alertBox) alertBox.style.display = 'block';
      showToast('Para registrar a crédito debes escribir el Nombre y Teléfono de la clienta', 'warning');
      return;
    }

    paidAmount = deposit;
    balanceDue = Math.max(0, total - deposit);
    payments.push({
      id: 'pay-' + Date.now(),
      date: new Date().toISOString(),
      amount: deposit,
      method: checkoutPaymentMethod,
      note: 'Abono inicial en venta'
    });
  } else {
    payments.push({
      id: 'pay-' + Date.now(),
      date: new Date().toISOString(),
      amount: total,
      method: checkoutPaymentMethod,
      note: 'Pago total de contado'
    });
  }

  const invoiceNumber = `${appState.config.invoicePrefix}${String(appState.config.nextInvoiceNumber).padStart(5, '0')}`;
  appState.config.nextInvoiceNumber += 1;

  const invoiceType = document.getElementById('invoiceTypeSelect').value;
  const notes = document.getElementById('invoiceNotesInput').value.trim();

  // Descontar inventario en tiempo real
  cart.items.forEach(item => {
    if (item.type === 'product') {
      const prod = appState.products.find(p => p.id === item.id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.qty);
        appState.inventoryMovements.push({
          id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          productId: prod.id,
          productName: prod.name,
          type: 'venta',
          qty: -item.qty,
          date: new Date().toISOString(),
          reason: `Venta Factura #${invoiceNumber}`
        });
      }
    }
  });

  // Calcular comisiones
  let stylistCommTotal = 0;
  cart.items.forEach(item => {
    const itemTotal = item.price * item.qty;
    if (item.type === 'service') {
      const commPercent = stylistObj ? stylistObj.serviceCommPercent : 45;
      stylistCommTotal += Math.round(itemTotal * (commPercent / 100));
    } else {
      const commPercent = stylistObj ? stylistObj.productCommPercent : 10;
      stylistCommTotal += Math.round(itemTotal * (commPercent / 100));
    }
  });

  const invoice = {
    id: 'inv-' + Date.now(),
    number: invoiceNumber,
    date: new Date().toISOString(),
    clientName,
    clientPhone,
    stylistId,
    stylistName,
    paymentMethod: checkoutPaymentMethod,
    subtotal,
    discount,
    total,
    paidAmount,
    balanceDue,
    paymentTerm: checkoutPaymentTerm,
    dueDate,
    status: balanceDue > 0 ? 'pendiente' : 'pagada',
    payments,
    stylistCommission: stylistCommTotal,
    items: JSON.parse(JSON.stringify(cart.items)),
    invoiceType,
    notes,
    appointmentId: cart.appointmentId
  };

  appState.invoices.unshift(invoice);

  if (cart.appointmentId) {
    const apt = appState.appointments.find(a => a.id === cart.appointmentId);
    if (apt) apt.status = 'cobrada';
  }

  saveState();
  lastCompletedInvoice = invoice;

  closeCheckoutModal();
  clearPOSCart();

  updateQuickCajaBadge();
  renderInventoryTable();
  renderInvoicesTable();
  renderDebtorsTable();
  renderAgendaList();
  renderReportsView();
  renderCommissionsView();
  renderClientStatsView();
  renderFiscalView();

  if (balanceDue > 0) {
    showToast(`¡Factura #${invoiceNumber} guardada a crédito! Saldo pendiente: ${formatMoney(balanceDue)}`, 'info');
  } else {
    showToast(`¡Venta #${invoiceNumber} procesada con éxito!`, 'success');
  }
  openReceiptModal(invoice);
}

// ==========================================================================
// 9. MODAL DE RECIBO / FORMATO TICKET EXACTO (IMAGEN 2) & IMPRESIÓN & WHATSAPP
// ==========================================================================

function initReceiptModal() {
  const modal = document.getElementById('receiptModal');
  const btnClose = document.getElementById('btnCloseReceipt');
  const btnPrint = document.getElementById('btnPrintReceipt');
  const btnPdf = document.getElementById('btnDownloadInvoicePdf');
  const btnWhatsApp = document.getElementById('btnShareWhatsApp');

  if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('active'));

  if (btnPrint) {
    btnPrint.addEventListener('click', printReceiptDirect);
  }

  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      if (lastCompletedInvoice) generateInvoicePdf(lastCompletedInvoice);
    });
  }

  if (btnWhatsApp) {
    btnWhatsApp.addEventListener('click', shareInvoiceViaWhatsApp);
  }
}

function openReceiptModal(invoice, fromHistory = false) {
  const modal = document.getElementById('receiptModal');
  const paper = document.getElementById('receiptPaper');
  if (!modal || !paper) return;

  lastCompletedInvoice = invoice;

  // Mostrar/ocultar botones Anular / Eliminar según si viene del historial
  const voidDeleteBtns = document.getElementById('receiptVoidDeleteBtns');
  if (voidDeleteBtns) {
    if (fromHistory && invoice.status !== 'anulada') {
      voidDeleteBtns.style.display = 'flex';
    } else {
      voidDeleteBtns.style.display = 'none';
    }
  }

  const dateObj = new Date(invoice.date);
  const formattedDate = dateObj.toLocaleDateString('es-ES') + ' ' + dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  paper.innerHTML = `
    <div class="receipt-header-center">
      <h2 class="receipt-salon-title">${escapeHtml(appState.config.salonName || 'VISOS KERATIN')}</h2>
      <span class="receipt-salon-sub">${escapeHtml(appState.config.slogan || '¡Donde tu cabello encuentra su mejor versión!')}</span>
      <span class="receipt-salon-sub">NIT: ${escapeHtml(appState.config.nit || '1095793030-1')} • Tel: ${escapeHtml(appState.config.phone || '+57 3166390429')}</span>
      <span class="receipt-salon-sub">${escapeHtml(appState.config.address || 'Mna B casa 38, Miraflores')}</span>
    </div>

    <div class="receipt-meta-row">
      <strong>FACTURA / TICKET:</strong>
      <strong>${invoice.number}</strong>
    </div>
    <div class="receipt-meta-row">
      <span>Fecha & Hora:</span>
      <span>${formattedDate}</span>
    </div>
    <div class="receipt-meta-row">
      <span>Clienta:</span>
      <span>${escapeHtml(invoice.clientName)}</span>
    </div>
    <div class="receipt-meta-row">
      <span>Estilista:</span>
      <span>${escapeHtml(invoice.stylistName)}</span>
    </div>
    <div class="receipt-meta-row">
      <span>Método de Pago:</span>
      <span style="text-transform: capitalize;">${invoice.paymentMethod}</span>
    </div>

    <table class="receipt-items-table">
      <thead>
        <tr>
          <th>Cant. Descripción</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map(item => `
          <tr>
            <td>${item.qty}x ${escapeHtml(item.name)}</td>
            <td style="text-align: right;">${formatMoney(item.price * item.qty)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="receipt-totals">
      <div class="receipt-meta-row">
        <span>Subtotal:</span>
        <span>${formatMoney(invoice.subtotal)}</span>
      </div>
      ${invoice.discount > 0 ? `
        <div class="receipt-meta-row" style="color:#B91C1C;">
          <span>Descuento:</span>
          <span>-${formatMoney(invoice.discount)}</span>
        </div>
      ` : ''}
      <div class="receipt-total-line">
        <span>TOTAL FACTURA:</span>
        <span>${formatMoney(invoice.total)}</span>
      </div>
      ${invoice.balanceDue > 0 ? `
        <div class="receipt-meta-row" style="color:#059669; font-weight:700; margin-top:4px;">
          <span>ABONO RECIBIDO:</span>
          <span>${formatMoney(invoice.paidAmount)}</span>
        </div>
        <div class="receipt-total-line" style="color:#DC2626; border-top:1px dashed #000; margin-top:4px; padding-top:4px;">
          <span>SALDO PENDIENTE:</span>
          <span>${formatMoney(invoice.balanceDue)}</span>
        </div>
        ${invoice.dueDate ? `
          <div class="receipt-meta-row" style="font-size:10.5px; margin-top:2px; font-style:italic;">
            <span>Fecha Límite Pago:</span>
            <span>${invoice.dueDate}</span>
          </div>
        ` : ''}
      ` : ''}
    </div>

    ${invoice.notes ? `
      <div style="margin-top:8px; font-size:11px; font-style:italic;">
        Nota: ${escapeHtml(invoice.notes)}
      </div>
    ` : ''}

    <div class="receipt-footer-msg">
      ${escapeHtml(appState.config.invoiceFooter || '¡Gracias por tu visita a Visos Keratin!.')}
      <br>
      <span style="font-size:9.5px; opacity:0.8;">Sistema Contable Visos Keratin</span>
    </div>
  `;

  modal.classList.add('active');
  initLucide();
}

/**
 * Impresión de Ticket adaptada a papel térmico (80mm) con el formato exacto de la Imagen 2
 */
function printReceiptDirect() {
  const printContents = document.getElementById('receiptPaper').innerHTML;
  const win = window.open('', '', 'width=420,height=600');

  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Ticket ${lastCompletedInvoice ? lastCompletedInvoice.number : 'Visos Keratin'}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          @media print {
            html, body {
              width: 80mm !important;
              max-width: 80mm !important;
              margin: 0 auto !important;
              padding: 2mm 3mm !important;
              background: #fff !important;
              color: #000 !important;
            }
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 80mm;
            max-width: 80mm;
            margin: 0 auto;
            padding: 4mm 4mm;
            font-size: 11.5px;
            line-height: 1.35;
            color: #000;
            background: #fff;
          }
          .receipt-header-center {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 6px;
            margin-bottom: 6px;
          }
          .receipt-salon-title {
            font-size: 17px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 2px;
          }
          .receipt-salon-sub {
            font-size: 10px;
            display: block;
            line-height: 1.3;
          }
          .receipt-meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 11px;
          }
          .receipt-items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 5px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
          }
          .receipt-items-table th {
            text-align: left;
            font-size: 10.5px;
            padding: 4px 0;
            border-bottom: 1px dashed #000;
          }
          .receipt-items-table td {
            padding: 3px 0;
            font-size: 11px;
          }
          .receipt-totals {
            margin-top: 3px;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
          }
          .receipt-total-line {
            display: flex;
            justify-content: space-between;
            font-weight: 700;
            font-size: 13px;
            border-top: 1px dashed #000;
            padding-top: 4px;
            margin-top: 3px;
          }
          .receipt-footer-msg {
            text-align: center;
            margin-top: 8px;
            font-size: 10px;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        ${printContents}
      </body>
    </html>
  `);

  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
}

/**
 * Envío de ticket por WhatsApp con formato exacto de venta (tipo ticket monospace Imagen 2)
 * sin caracteres especiales que se rompan en diamantes.
 */
function shareInvoiceViaWhatsApp() {
  if (!lastCompletedInvoice) return;
  const inv = lastCompletedInvoice;

  const ticketText = formatTicketForWhatsApp(inv);
  const cleanPhone = (inv.clientPhone || '').replace(/\D/g, '');

  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(ticketText)}`
    : `https://wa.me/?text=${encodeURIComponent(ticketText)}`;

  window.open(waUrl, '_blank');
}

function formatTicketForWhatsApp(inv) {
  const WIDTH = 40;
  const divider = '-'.repeat(WIDTH);

  function center(text) {
    text = String(text || '').trim();
    if (text.length >= WIDTH) return text.slice(0, WIDTH);
    const leftPad = Math.floor((WIDTH - text.length) / 2);
    return ' '.repeat(leftPad) + text;
  }

  function row(left, right) {
    left = String(left || '');
    right = String(right || '');
    const spaces = Math.max(1, WIDTH - left.length - right.length);
    return left + ' '.repeat(spaces) + right;
  }

  const d = new Date(inv.date);
  const dateStr = d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const lines = [
    '```',
    divider,
    center(appState.config.salonName || 'VISOS KERATIN'),
    center(appState.config.slogan || '¡Donde tu cabello encuentra su mejor versión!'),
    center(`NIT: ${appState.config.nit || '1095793030-1'} • Tel: ${appState.config.phone || '+57 3166390429'}`),
    center(appState.config.address || 'Mna B casa 38, Miraflores'),
    divider,
    row('FACTURA / TICKET:', inv.number),
    row('Fecha & Hora:', dateStr),
    row('Clienta:', inv.clientName || 'Clienta General'),
    row('Estilista:', inv.stylistName || 'Estilista'),
    row('Método de Pago:', (inv.paymentMethod || 'Efectivo').charAt(0).toUpperCase() + (inv.paymentMethod || 'Efectivo').slice(1)),
    divider,
    row('Cant. Descripción', 'Total')
  ];

  inv.items.forEach(item => {
    const itemTotalStr = formatMoney(item.price * item.qty);
    const itemDesc = `${item.qty}x ${item.name}`;
    if (itemDesc.length + itemTotalStr.length + 1 > WIDTH) {
      const maxDescLen = WIDTH - itemTotalStr.length - 2;
      lines.push(row(itemDesc.slice(0, maxDescLen), itemTotalStr));
    } else {
      lines.push(row(itemDesc, itemTotalStr));
    }
  });

  lines.push(divider);
  lines.push(row('Subtotal:', formatMoney(inv.subtotal)));

  if (inv.discount > 0) {
    lines.push(row('Descuento:', `-${formatMoney(inv.discount)}`));
    lines.push(divider);
  }

  lines.push(row('TOTAL FACTURA:', formatMoney(inv.total)));
  if (inv.balanceDue > 0) {
    lines.push(row('ABONO RECIBIDO:', formatMoney(inv.paidAmount)));
    lines.push(divider);
    lines.push(row('SALDO PENDIENTE:', formatMoney(inv.balanceDue)));
    if (inv.dueDate) {
      lines.push(row('Fecha Limite:', inv.dueDate));
    }
  }
  lines.push(divider);
  lines.push(center(appState.config.invoiceFooter || '¡Gracias por tu visita a Visos Keratin!.'));
  lines.push(center('Sistema Contable Visos Keratin'));
  lines.push(divider);
  lines.push('```');

  return lines.join('\n');
}

function generateInvoicePdf(invoice) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast('Librería de PDF cargando, intenta de nuevo...', 'warning');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const dateObj = new Date(invoice.date);
  const formattedDate = dateObj.toLocaleDateString('es-ES') + ' ' + dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  doc.setFillColor(27, 43, 75);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(212, 160, 23);
  doc.text(appState.config.salonName || 'VISOS KERATIN', 14, 18);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(appState.config.slogan || '', 14, 25);
  doc.text(`NIT: ${appState.config.nit || ''} • Tel: ${appState.config.phone || ''} • ${appState.config.address || ''}`, 14, 30);

  doc.setFontSize(14);
  doc.setTextColor(212, 160, 23);
  doc.text('FACTURA DE VENTA', 196, 18, { align: 'right' });
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`Nº ${invoice.number}`, 196, 26, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 44, 182, 28, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA CLIENTA', 20, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${invoice.clientName}`, 20, 59);
  doc.text(`Teléfono: ${invoice.clientPhone || 'No registrado'}`, 20, 66);

  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DE ATENCIÓN', 110, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formattedDate}`, 110, 59);
  doc.text(`Estilista: ${invoice.stylistName}  •  Pago: ${invoice.paymentMethod.toUpperCase()}`, 110, 66);

  const tableRows = invoice.items.map(item => [
    item.type === 'service' ? 'Servicio' : 'Producto',
    item.name,
    item.qty,
    formatMoney(item.price),
    formatMoney(item.price * item.qty)
  ]);

  doc.autoTable({
    startY: 80,
    head: [['Tipo', 'Descripción del Ítem', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [27, 43, 75],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 84 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 27, halign: 'right' },
      4: { cellWidth: 27, halign: 'right' }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 140, finalY);
  doc.text(formatMoney(invoice.subtotal), 196, finalY, { align: 'right' });

  let offset = finalY;
  if (invoice.discount > 0) {
    offset += 6;
    doc.setTextColor(185, 28, 28);
    doc.text('Descuento Especial:', 140, offset);
    doc.text(`-${formatMoney(invoice.discount)}`, 196, offset, { align: 'right' });
  }

  offset += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(212, 160, 23);
  doc.text('TOTAL FACTURADO:', 125, offset);
  doc.text(formatMoney(invoice.total), 196, offset, { align: 'right' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(appState.config.invoiceFooter || '¡Gracias por su compra!', 105, 270, { align: 'center' });
  doc.text('Documento de control interno no válido como factura electrónica fiscal según normatividad vigente.', 105, 275, { align: 'center' });

  doc.save(`Factura-${invoice.number}.pdf`);
  showToast(`Factura ${invoice.number} descargada en PDF`, 'success');
}

// ==========================================================================
// 10. MÓDULO AGENDA & ENLACE CON LA APP DE CITAS
// ==========================================================================

let agendaFilter = 'all';

function initAgenda() {
  const datePicker = document.getElementById('agendaDatePicker');
  const btnPrev = document.getElementById('btnPrevDay');
  const btnNext = document.getElementById('btnNextDay');
  const btnToday = document.getElementById('btnTodayAgenda');
  const filterBtns = document.querySelectorAll('.agenda-tabs .tab-filter-btn');
  const btnFetch = document.getElementById('btnFetchFromVisosApp');
  const btnNewManual = document.getElementById('btnNewAppointmentManual');

  if (datePicker) {
    datePicker.value = getTodayIso();
    datePicker.addEventListener('change', renderAgendaList);
  }

  if (btnToday) {
    btnToday.addEventListener('click', () => {
      datePicker.value = getTodayIso();
      renderAgendaList();
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => shiftAgendaDate(-1));
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => shiftAgendaDate(1));
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      agendaFilter = btn.getAttribute('data-filter');
      renderAgendaList();
    });
  });

  if (btnFetch) btnFetch.addEventListener('click', syncAppointmentsFromVisos);
  if (btnNewManual) btnNewManual.addEventListener('click', openAppointmentModal);

  initAppointmentModal();
}

function shiftAgendaDate(days) {
  const picker = document.getElementById('agendaDatePicker');
  const current = new Date(picker.value + 'T00:00:00');
  current.setDate(current.getDate() + days);
  picker.value = current.toISOString().split('T')[0];
  renderAgendaList();
}

function renderAgendaList() {
  const grid = document.getElementById('appointmentsGrid');
  const datePicker = document.getElementById('agendaDatePicker');
  const selectedDate = datePicker ? datePicker.value : getTodayIso();

  const dayAppointments = appState.appointments.filter(a => a.date === selectedDate);

  const countAll = dayAppointments.length;
  const countPend = dayAppointments.filter(a => a.status === 'pendiente').length;
  const countAtend = dayAppointments.filter(a => a.status === 'atendiendo').length;
  const countCob = dayAppointments.filter(a => a.status === 'cobrada').length;

  document.getElementById('countAllAppointments').textContent = countAll;
  document.getElementById('countPendientes').textContent = countPend;
  document.getElementById('countAtendiendo').textContent = countAtend;
  document.getElementById('countCobradas').textContent = countCob;
  document.getElementById('agendaBadge').textContent = countPend + countAtend;

  const countInfoEl = document.getElementById('agendaCountInfo');
  if (countInfoEl) {
    countInfoEl.textContent = `${countAll} clientas agendadas para el día ${selectedDate}`;
  }

  const filtered = dayAppointments.filter(a => {
    if (agendaFilter === 'all') return true;
    return a.status === agendaFilter;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted); background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <i data-lucide="calendar" style="width: 40px; height: 40px; margin-bottom: 8px; color: var(--gold); opacity: 0.6;"></i>
        <h4 style="color: var(--navy); margin-bottom: 4px;">No hay clientas para este filtro</h4>
        <p style="font-size: 13px;">Usa el botón "Sincronizar Citas" o agrega una cita manualmente.</p>
      </div>
    `;
    initLucide();
    return;
  }

  grid.innerHTML = filtered.map(apt => {
    let statusLabel = '⏳ En Espera';
    let statusClass = 'status-badge-pendiente';
    if (apt.status === 'atendiendo') {
      statusLabel = '💇 En Atención';
      statusClass = 'status-badge-atendiendo';
    } else if (apt.status === 'cobrada') {
      statusLabel = '✅ Facturada';
      statusClass = 'status-badge-cobrada';
    }

    return `
      <div class="appointment-card status-${apt.status}">
        <div class="apt-header">
          <span class="apt-time">${apt.time}</span>
          <span class="apt-status-badge ${statusClass}">${statusLabel}</span>
        </div>

        <div class="apt-client-info">
          <h4>${escapeHtml(apt.clientName)}</h4>
          <span class="apt-phone">📱 ${escapeHtml(apt.clientPhone)}</span>
        </div>

        <div class="apt-details">
          <div class="apt-service-line">✂️ ${escapeHtml(apt.serviceName)}</div>
          <div class="apt-stylist-line">👤 Atiende: <strong>${escapeHtml(apt.stylistName)}</strong></div>
        </div>

        <div class="apt-actions">
          ${apt.status !== 'cobrada' ? `
            <button class="btn-apt-charge" onclick="chargeAppointment('${apt.id}')">
              <i data-lucide="zap" style="width: 14px; height: 14px;"></i>
              <span>Cobrar Ahora</span>
            </button>
            <button class="btn-apt-status" onclick="cycleAppointmentStatus('${apt.id}')" title="Cambiar estado">
              ${apt.status === 'pendiente' ? 'Iniciar Atención' : 'Listo'}
            </button>
          ` : `
            <span style="font-size:12px; color:var(--emerald-dark); font-weight:700;">✓ Factura generada</span>
            <button class="btn-apt-status" onclick="chargeAppointment('${apt.id}')" style="margin-left:auto;">
              Cobrar adicional
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  initLucide();
}

window.chargeAppointment = function(aptId) {
  const apt = appState.appointments.find(a => a.id === aptId);
  if (!apt) return;

  cart.items = [];
  cart.appointmentId = apt.id;
  cart.clientName = apt.clientName;
  cart.clientPhone = apt.clientPhone;
  cart.stylistId = apt.stylistId || 'e1';

  document.getElementById('posClientName').value = apt.clientName;
  document.getElementById('posStylistSelect').value = cart.stylistId;

  const banner = document.getElementById('posClientBanner');
  const bannerName = document.getElementById('posBannerName');
  const bannerDetail = document.getElementById('posBannerDetail');
  const bannerAvatar = document.getElementById('posBannerAvatar');

  if (banner && bannerName && bannerDetail) {
    bannerName.textContent = apt.clientName;
    bannerDetail.textContent = `Hora: ${apt.time} • Estilista: ${apt.stylistName} • Tel: ${apt.clientPhone}`;
    if (bannerAvatar) {
      bannerAvatar.textContent = apt.clientName.slice(0, 2).toUpperCase();
    }
    banner.style.display = 'flex';
  }

  if (apt.serviceId) {
    addItemToCart(apt.serviceId, 'service');
  }

  switchTab('tab-pos');
  showToast(`Clienta ${apt.clientName} cargada en caja`, 'info');
};

window.cycleAppointmentStatus = function(aptId) {
  const apt = appState.appointments.find(a => a.id === aptId);
  if (!apt) return;

  if (apt.status === 'pendiente') {
    apt.status = 'atendiendo';
  } else if (apt.status === 'atendiendo') {
    apt.status = 'pendiente';
  }

  saveState();
  renderAgendaList();
};

async function syncAppointmentsFromVisos() {
  const syncBtn = document.getElementById('btnSyncAppointments');
  if (syncBtn) syncBtn.classList.add('spinning');

  showToast('Consultando citas en visoskeratin.vercel.app...', 'info');

  try {
    const url = `${appState.config.firebaseUrl}/citas.json`;
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();

    if (!data) {
      showToast('No hay nuevas citas registradas en la nube.', 'info');
      return;
    }

    let importedCount = 0;

    Object.keys(data).forEach(key => {
      const item = data[key];
      if (!item || item.estado === 'cancelada') return;

      const exists = appState.appointments.some(a => a.firebaseKey === key || (a.clientName === item.nombre && a.date === item.fecha && a.time === item.hora));

      if (!exists) {
        let stylistName = 'Leidy';
        let stylistId = 'e1';
        if (item.estilista) {
          const matched = appState.stylists.find(s => s.id === item.estilista || s.name.toLowerCase().includes(item.estilista.toLowerCase()));
          if (matched) {
            stylistName = matched.name;
            stylistId = matched.id;
          }
        }

        let serviceName = item.servicios ? (Array.isArray(item.servicios) ? item.servicios.join(', ') : item.servicios) : 'Tratamiento Visos';
        let matchedServiceId = 'svc-kera';
        if (item.servicios) {
          const firstSvcId = Array.isArray(item.servicios) ? item.servicios[0] : item.servicios;
          const foundSvc = appState.services.find(s => s.id === firstSvcId || s.name.toLowerCase().includes(String(firstSvcId).toLowerCase()));
          if (foundSvc) matchedServiceId = foundSvc.id;
        }

        appState.appointments.push({
          id: 'apt-fb-' + key,
          firebaseKey: key,
          clientName: item.nombre || 'Clienta Web',
          clientPhone: item.telefono || item.whatsapp || '+57 300 000 0000',
          serviceId: matchedServiceId,
          serviceName: serviceName,
          stylistId,
          stylistName,
          date: item.fecha || getTodayIso(),
          time: item.hora || '10:00',
          status: 'pendiente'
        });

        importedCount += 1;
      }
    });

    saveState();
    renderAgendaList();
    renderClientStatsView();

    if (importedCount > 0) {
      showToast(`¡Se sincronizaron ${importedCount} citas nuevas con éxito!`, 'success');
    } else {
      showToast('Todas las citas de la web ya están al día.', 'success');
    }
  } catch (err) {
    console.warn('Fallo al conectar con Firebase de Visos:', err);
    showToast('Aviso: Base de datos en la nube sin conexión. Se continúa en modo local.', 'warning');
  } finally {
    if (syncBtn) syncBtn.classList.remove('spinning');
  }
}

function initAppointmentModal() {
  const modal = document.getElementById('appointmentModal');
  const btnClose = document.getElementById('btnCloseAppointmentModal');
  const btnCancel = document.getElementById('btnCancelAppointmentModal');
  const form = document.getElementById('appointmentForm');

  if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('active'));
  if (btnCancel) btnCancel.addEventListener('click', () => modal.classList.remove('active'));

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const clientName = document.getElementById('aptClientName').value.trim();
      const clientPhone = document.getElementById('aptClientPhone').value.trim();
      const date = document.getElementById('aptDate').value;
      const time = document.getElementById('aptTime').value;
      const stylistId = document.getElementById('aptStylistSelect').value;
      const serviceId = document.getElementById('aptServiceSelect').value;

      const stylist = appState.stylists.find(s => s.id === stylistId);
      const service = appState.services.find(s => s.id === serviceId);

      appState.appointments.push({
        id: 'apt-man-' + Date.now(),
        clientName,
        clientPhone,
        serviceId,
        serviceName: service ? service.name : 'Servicio General',
        stylistId,
        stylistName: stylist ? stylist.name : 'Leidy',
        date,
        time,
        status: 'pendiente'
      });

      saveState();
      renderAgendaList();
      renderClientStatsView();
      modal.classList.remove('active');
      form.reset();
      showToast('Cita agendada correctamente', 'success');
    });
  }
}

function openAppointmentModal() {
  const modal = document.getElementById('appointmentModal');
  const dateInput = document.getElementById('aptDate');
  populateServiceSelects();

  if (dateInput) dateInput.value = document.getElementById('agendaDatePicker').value || getTodayIso();
  modal.classList.add('active');
}

// ==========================================================================
// 11. MÓDULO INVENTARIO EN TIEMPO REAL (PRESERVADO)
// ==========================================================================

let inventorySearchQuery = '';
let inventoryCategoryFilter = 'all';
let inventoryStockStatusFilter = 'all';

function initInventory() {
  const searchInput = document.getElementById('inventorySearchInput');
  const catFilter = document.getElementById('inventoryCategoryFilter');
  const stockFilter = document.getElementById('inventoryStockStatusFilter');
  const btnNewProd = document.getElementById('btnNewProductModal');
  const btnMovement = document.getElementById('btnStockMovementModal');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      inventorySearchQuery = e.target.value.toLowerCase().trim();
      renderInventoryTable();
    });
  }

  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      inventoryCategoryFilter = e.target.value;
      renderInventoryTable();
    });
  }

  if (stockFilter) {
    stockFilter.addEventListener('change', (e) => {
      inventoryStockStatusFilter = e.target.value;
      renderInventoryTable();
    });
  }

  if (btnNewProd) btnNewProd.addEventListener('click', () => openProductModal());
  if (btnMovement) btnMovement.addEventListener('click', openStockMovementModal);

  initProductModal();
  initStockMovementModal();
}

function renderInventoryTable() {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  const filtered = appState.products.filter(p => {
    if (inventoryCategoryFilter !== 'all') {
      if (inventoryCategoryFilter === 'retail' && p.type !== 'retail') return false;
      if (inventoryCategoryFilter === 'cabina' && p.type !== 'cabina') return false;
      if (inventoryCategoryFilter !== 'retail' && inventoryCategoryFilter !== 'cabina' && p.category !== inventoryCategoryFilter) return false;
    }

    if (inventoryStockStatusFilter === 'low' && p.stock > p.minStock) return false;
    if (inventoryStockStatusFilter === 'ok' && p.stock <= p.minStock) return false;

    if (inventorySearchQuery) {
      const matchName = p.name.toLowerCase().includes(inventorySearchQuery);
      const matchSku = (p.sku || '').toLowerCase().includes(inventorySearchQuery);
      if (!matchName && !matchSku) return false;
    }

    return true;
  });

  const totalProducts = appState.products.length;
  const totalCostValue = appState.products.reduce((acc, p) => acc + (p.cost * p.stock), 0);
  const totalRetailValue = appState.products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const lowStockCount = appState.products.filter(p => p.stock <= p.minStock).length;

  document.getElementById('metricTotalProducts').textContent = totalProducts;
  document.getElementById('metricTotalStockValue').textContent = formatMoney(totalCostValue);
  document.getElementById('metricTotalRetailValue').textContent = formatMoney(totalRetailValue);
  document.getElementById('metricLowStockCount').textContent = lowStockCount;

  const lowStockBadge = document.getElementById('lowStockBadge');
  if (lowStockBadge) {
    lowStockBadge.style.display = lowStockCount > 0 ? 'inline-flex' : 'none';
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          No hay productos que coincidan con la búsqueda.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    let stockStatusBadge = '';
    if (p.stock <= 0) {
      stockStatusBadge = `<span class="badge-stock badge-stock-out">Agotado</span>`;
    } else if (p.stock <= p.minStock) {
      stockStatusBadge = `<span class="badge-stock badge-stock-low">Stock Bajo</span>`;
    } else {
      stockStatusBadge = `<span class="badge-stock badge-stock-ok">Normal</span>`;
    }

    return `
      <tr>
        <td><code>${escapeHtml(p.sku || 'S/N')}</code></td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>
          <span style="font-size: 11.5px; text-transform: capitalize;">
            ${p.type === 'retail' ? '🛍️ Venta' : '🧴 Cabina'} • ${p.category}
          </span>
        </td>
        <td class="text-right">
          <strong style="font-size: 14px; color: ${p.stock <= p.minStock ? 'var(--rose)' : 'var(--navy)'};">
            ${p.stock}
          </strong>
        </td>
        <td class="text-right" style="color: var(--text-muted);">${p.minStock}</td>
        <td class="text-right">${formatMoney(p.cost)}</td>
        <td class="text-right"><strong style="color: var(--gold);">${formatMoney(p.price)}</strong></td>
        <td class="text-center">${stockStatusBadge}</td>
        <td class="text-center">
          <div class="table-row-actions">
            <button class="btn-tbl-action" onclick="quickStockAdjust('${p.id}', 1)" title="Sumar 1 unidad">+1</button>
            <button class="btn-tbl-action" onclick="quickStockAdjust('${p.id}', -1)" title="Restar 1 unidad">-1</button>
            <button class="btn-tbl-action" onclick="openProductModal('${p.id}')" title="Editar">✏️</button>
            <button class="btn-tbl-action" onclick="deleteProduct('${p.id}')" title="Eliminar" style="color: var(--rose);">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  initLucide();
}

window.quickStockAdjust = function(productId, delta) {
  const prod = appState.products.find(p => p.id === productId);
  if (!prod) return;

  const newStock = prod.stock + delta;
  if (newStock < 0) {
    showToast('El stock no puede ser menor a cero', 'warning');
    return;
  }

  prod.stock = newStock;
  appState.inventoryMovements.push({
    id: 'mov-' + Date.now(),
    productId: prod.id,
    productName: prod.name,
    type: delta > 0 ? 'ajuste_positivo' : 'ajuste_negativo',
    qty: delta,
    date: new Date().toISOString(),
    reason: 'Ajuste rápido desde tabla'
  });

  saveState();
  renderInventoryTable();
  renderPOSCatalog();
};

window.deleteProduct = function(productId) {
  const prod = appState.products.find(p => p.id === productId);
  if (!prod) return;

  if (confirm(`¿Eliminar definitivamente "${prod.name}" del inventario?`)) {
    appState.products = appState.products.filter(p => p.id !== productId);
    saveState();
    renderInventoryTable();
    renderPOSCatalog();
    showToast('Producto eliminado', 'info');
  }
};

function initProductModal() {
  const modal = document.getElementById('productModal');
  const btnClose = document.getElementById('btnCloseProductModal');
  const btnCancel = document.getElementById('btnCancelProductModal');
  const form = document.getElementById('productForm');

  if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('active'));
  if (btnCancel) btnCancel.addEventListener('click', () => modal.classList.remove('active'));

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const editId = document.getElementById('prodEditId').value;
      const name = document.getElementById('prodName').value.trim();
      const sku = document.getElementById('prodSku').value.trim();
      const type = document.getElementById('prodType').value;
      const category = document.getElementById('prodCategory').value;
      const stock = Number(document.getElementById('prodStock').value) || 0;
      const minStock = Number(document.getElementById('prodMinStock').value) || 2;
      const cost = Number(document.getElementById('prodCost').value) || 0;
      const price = Number(document.getElementById('prodPrice').value) || 0;

      if (editId) {
        const prod = appState.products.find(p => p.id === editId);
        if (prod) {
          prod.name = name;
          prod.sku = sku;
          prod.type = type;
          prod.category = category;
          prod.stock = stock;
          prod.minStock = minStock;
          prod.cost = cost;
          prod.price = price;
        }
        showToast('Producto actualizado con éxito', 'success');
      } else {
        appState.products.push({
          id: 'prd-' + Date.now(),
          name,
          sku: sku || 'VK-' + Math.floor(Math.random() * 900 + 100),
          type,
          category,
          stock,
          minStock,
          cost,
          price
        });
        showToast('Nuevo producto agregado al inventario', 'success');
      }

      saveState();
      renderInventoryTable();
      renderPOSCatalog();
      modal.classList.remove('active');
    });
  }
}

window.openProductModal = function(productId = null) {
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const title = document.getElementById('productModalTitle');

  form.reset();
  document.getElementById('prodEditId').value = '';

  if (productId) {
    const prod = appState.products.find(p => p.id === productId);
    if (!prod) return;

    title.textContent = 'Editar Producto de Inventario';
    document.getElementById('prodEditId').value = prod.id;
    document.getElementById('prodName').value = prod.name;
    document.getElementById('prodSku').value = prod.sku || '';
    document.getElementById('prodType').value = prod.type;
    document.getElementById('prodCategory').value = prod.category;
    document.getElementById('prodStock').value = prod.stock;
    document.getElementById('prodMinStock').value = prod.minStock;
    document.getElementById('prodCost').value = prod.cost;
    document.getElementById('prodPrice').value = prod.price;
  } else {
    title.textContent = 'Nuevo Producto de Inventario';
  }

  modal.classList.add('active');
};

function initStockMovementModal() {
  const modal = document.getElementById('stockMovementModal');
  const btnClose = document.getElementById('btnCloseMovementModal');
  const btnCancel = document.getElementById('btnCancelMovementModal');
  const form = document.getElementById('stockMovementForm');

  if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('active'));
  if (btnCancel) btnCancel.addEventListener('click', () => modal.classList.remove('active'));

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const prodId = document.getElementById('movProductSelect').value;
      const movType = document.getElementById('movType').value;
      const qty = Number(document.getElementById('movQuantity').value) || 1;
      const reason = document.getElementById('movReason').value.trim();

      const prod = appState.products.find(p => p.id === prodId);
      if (!prod) return;

      if (movType === 'entrada') {
        prod.stock += qty;
      } else {
        if (qty > prod.stock) {
          showToast(`Stock insuficiente. Solo hay ${prod.stock} disponibles`, 'warning');
          return;
        }
        prod.stock -= qty;
      }

      appState.inventoryMovements.push({
        id: 'mov-' + Date.now(),
        productId: prod.id,
        productName: prod.name,
        type: movType,
        qty: movType === 'entrada' ? qty : -qty,
        date: new Date().toISOString(),
        reason: reason || movType
      });

      saveState();
      renderInventoryTable();
      renderPOSCatalog();
      modal.classList.remove('active');
      showToast('Ajuste de inventario aplicado', 'success');
    });
  }
}

function openStockMovementModal() {
  const modal = document.getElementById('stockMovementModal');
  const select = document.getElementById('movProductSelect');
  if (select) {
    select.innerHTML = appState.products.map(p => `
      <option value="${p.id}">${p.name} (Stock actual: ${p.stock})</option>
    `).join('');
  }
  modal.classList.add('active');
}

// ==========================================================================
// 12. MÓDULO FACTURAS GENERADAS
// ==========================================================================

let invoicesSearchQuery = '';
let invoicesDateFilter = '';
let invoicesPaymentFilter = 'all';

function initInvoices() {
  const searchInput = document.getElementById('invoicesSearchInput');
  const dateFilter = document.getElementById('invoicesDateFilter');
  const payFilter = document.getElementById('invoicesPaymentFilter');
  const btnExportCsv = document.getElementById('btnExportInvoicesCsv');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      invoicesSearchQuery = e.target.value.toLowerCase().trim();
      renderInvoicesTable();
    });
  }

  if (dateFilter) {
    dateFilter.addEventListener('change', (e) => {
      invoicesDateFilter = e.target.value;
      renderInvoicesTable();
    });
  }

  if (payFilter) {
    payFilter.addEventListener('change', (e) => {
      invoicesPaymentFilter = e.target.value;
      renderInvoicesTable();
    });
  }

  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', exportInvoicesToCsv);
  }

  // Botones Anular / Eliminar en modal de comprobante
  const btnVoid = document.getElementById('btnVoidInvoice');
  const btnDel  = document.getElementById('btnDeleteInvoice');
  if (btnVoid) {
    btnVoid.addEventListener('click', () => {
      if (lastCompletedInvoice) voidInvoice(lastCompletedInvoice.id);
    });
  }
  if (btnDel) {
    btnDel.addEventListener('click', () => {
      if (lastCompletedInvoice) deleteInvoice(lastCompletedInvoice.id);
    });
  }
}

function renderInvoicesTable() {
  const tbody = document.getElementById('invoicesTableBody');
  if (!tbody) return;

  const filtered = appState.invoices.filter(inv => {
    if (invoicesPaymentFilter !== 'all' && inv.paymentMethod !== invoicesPaymentFilter) return false;
    if (invoicesDateFilter && !inv.date.startsWith(invoicesDateFilter)) return false;

    if (invoicesSearchQuery) {
      const matchNum = inv.number.toLowerCase().includes(invoicesSearchQuery);
      const matchClient = inv.clientName.toLowerCase().includes(invoicesSearchQuery);
      if (!matchNum && !matchClient) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          No se encontraron facturas registradas.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(inv => {
    const d = new Date(inv.date);
    const dateStr = d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const isAnulada = inv.status === 'anulada';

    return `
      <tr style="${isAnulada ? 'opacity:0.55; background:#FFF5F5;' : ''}">
        <td><strong>${inv.number}</strong>${isAnulada ? ' <span style="color:#DC2626; font-size:10px; font-weight:700;">ANULADA</span>' : ''}</td>
        <td>${dateStr}</td>
        <td>${escapeHtml(inv.clientName)}</td>
        <td>${escapeHtml(inv.stylistName)}</td>
        <td><span style="text-transform: capitalize;">${inv.paymentMethod}</span></td>
        <td class="text-right">
          <strong style="color:${isAnulada ? '#9CA3AF' : 'var(--gold)'}; ${isAnulada ? 'text-decoration:line-through;' : ''}">${formatMoney(inv.total)}</strong>
          ${!isAnulada && inv.balanceDue > 0 ? `<br><small style="color:#DC2626; font-weight:700;">Debe: ${formatMoney(inv.balanceDue)}</small>` : ''}
        </td>
        <td class="text-center">
          ${isAnulada
            ? `<span class="badge-stock" style="background:#FEE2E2; color:#DC2626; border:1px solid #FCA5A5; border-radius:4px; padding:2px 8px; font-size:11px; font-weight:700;">🚫 Anulada</span>`
            : inv.balanceDue > 0
              ? `<span class="badge-stock badge-stock-low" style="background:#FEF2F2; color:#DC2626; border-color:#FCA5A5;">Crédito (Abonó ${formatMoney(inv.paidAmount)})</span>`
              : `<span class="badge-stock badge-stock-ok">Pagada</span>`
          }
        </td>
        <td class="text-center">
          <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap;">
            <button class="btn-tbl-action" onclick="viewExistingInvoice('${inv.id}')" title="Ver Ticket">
              👁️ Ver
            </button>
            ${!isAnulada && inv.balanceDue > 0 ? `
              <button class="btn-tbl-action" onclick="openClientPaymentModal('${inv.id}')" style="color:#059669; font-weight:700; border-color:#059669;" title="Registrar Abono">
                💵 Abonar
              </button>
            ` : ''}
            ${!isAnulada ? `
              <button class="btn-tbl-action" onclick="voidInvoice('${inv.id}')" style="color:#DC2626; border-color:#DC2626;" title="Anular Factura">
                🚫 Anular
              </button>
            ` : ''}
            <button class="btn-tbl-action" onclick="deleteInvoice('${inv.id}')" style="color:#6B7280; border-color:#D1D5DB;" title="Eliminar Factura">
              🗑️ Eliminar
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.viewExistingInvoice = function(invoiceId) {
  const inv = appState.invoices.find(i => i.id === invoiceId);
  if (inv) openReceiptModal(inv, true); // true = viene del historial
};

function exportInvoicesToCsv() {
  if (appState.invoices.length === 0) {
    showToast('No hay facturas para exportar', 'warning');
    return;
  }

  let csv = 'Numero,Fecha,Clienta,Estilista,Metodo_Pago,Subtotal,Descuento,Total,Estado\n';
  appState.invoices.forEach(i => {
    csv += `"${i.number}","${i.date}","${i.clientName}","${i.stylistName}","${i.paymentMethod}",${i.subtotal},${i.discount},${i.total},"${i.status || 'pagada'}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Facturas_VisosKeratin_${getTodayIso()}.csv`);
  link.click();
}

// ==========================================================================
// ANULAR FACTURA
// Marca la factura como anulada, revierte stock de productos y ajusta caja.
// ==========================================================================
window.voidInvoice = function(invoiceId) {
  const inv = appState.invoices.find(i => i.id === invoiceId);
  if (!inv) return;
  if (inv.status === 'anulada') {
    showToast('Esta factura ya fue anulada.', 'warning');
    return;
  }

  const motivo = prompt(
    `¿Motivo de anulación de la factura ${inv.number}?\n(Escribe el motivo o presiona Cancelar para no anular)`,
    ''
  );
  if (motivo === null) return; // usuario canceló

  // Revertir stock de productos vendidos
  (inv.items || []).forEach(item => {
    if (item.type === 'product') {
      const prod = appState.products.find(p => p.id === item.id);
      if (prod) {
        prod.stock = (prod.stock || 0) + (item.qty || 1);
        // Registrar movimiento kardex de devolución
        if (!appState.kardex) appState.kardex = [];
        appState.kardex.push({
          id: 'KDX-' + Date.now(),
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          type: 'devolucion_anulacion',
          qty: item.qty || 1,
          cost: prod.cost || 0,
          reference: `Anulación factura ${inv.number}`,
          notes: motivo || 'Sin motivo'
        });
      }
    }
  });

  // Marcar factura como anulada
  inv.status = 'anulada';
  inv.voidedAt = new Date().toISOString();
  inv.voidReason = motivo || 'Sin motivo especificado';
  inv.balanceDue = 0;

  // Si la clienta estaba en deudoras, limpiarla si era por esta factura
  if (appState.debtors) {
    const debtorIdx = appState.debtors.findIndex(d => d.invoiceId === invoiceId);
    if (debtorIdx !== -1) {
      appState.debtors.splice(debtorIdx, 1);
    }
  }

  // Cerrar el modal de comprobante si está abierto sobre esta factura
  const modal = document.getElementById('receiptModal');
  if (modal && modal.classList.contains('active')) {
    modal.classList.remove('active');
  }

  saveState();
  renderInvoicesTable();
  renderInventoryTable();
  renderDebtorsTable();
  updateQuickCajaBadge();
  showToast(`Factura ${inv.number} anulada correctamente. Stock revertido.`, 'success');
};

// ==========================================================================
// ELIMINAR FACTURA
// Elimina definitivamente la factura. Si no estaba anulada, revierte stock.
// ==========================================================================
window.deleteInvoice = function(invoiceId) {
  const inv = appState.invoices.find(i => i.id === invoiceId);
  if (!inv) return;

  const confirmMsg = inv.status === 'anulada'
    ? `¿Eliminar definitivamente la factura ${inv.number} (ya anulada)? Esta acción no se puede deshacer.`
    : `¿Eliminar definitivamente la factura ${inv.number}?\n\nSi tiene productos vendidos, se revertirá el stock. Esta acción NO se puede deshacer.`;

  if (!confirm(confirmMsg)) return;

  // Si no estaba anulada, revertir stock antes de eliminar
  if (inv.status !== 'anulada') {
    (inv.items || []).forEach(item => {
      if (item.type === 'product') {
        const prod = appState.products.find(p => p.id === item.id);
        if (prod) {
          prod.stock = (prod.stock || 0) + (item.qty || 1);
          if (!appState.kardex) appState.kardex = [];
          appState.kardex.push({
            id: 'KDX-' + Date.now() + Math.random(),
            date: new Date().toISOString(),
            productId: prod.id,
            productName: prod.name,
            type: 'devolucion_eliminacion',
            qty: item.qty || 1,
            cost: prod.cost || 0,
            reference: `Eliminación factura ${inv.number}`,
            notes: 'Factura eliminada por administrador'
          });
        }
      }
    });
  }

  // Eliminar de deudoras si aplica
  if (appState.debtors) {
    const debtorIdx = appState.debtors.findIndex(d => d.invoiceId === invoiceId);
    if (debtorIdx !== -1) appState.debtors.splice(debtorIdx, 1);
  }

  // Eliminar la factura del array
  const idx = appState.invoices.findIndex(i => i.id === invoiceId);
  if (idx !== -1) appState.invoices.splice(idx, 1);

  // Cerrar modal si estaba abierto
  const modal = document.getElementById('receiptModal');
  if (modal && modal.classList.contains('active')) {
    modal.classList.remove('active');
  }

  saveState();
  renderInvoicesTable();
  renderInventoryTable();
  renderDebtorsTable();
  updateQuickCajaBadge();
  showToast(`Factura ${inv.number} eliminada definitivamente.`, 'success');
};

// ==========================================================================
// 13. MÓDULO CAJA & GASTOS (ARQUEO DIARIO)
// ==========================================================================

function initCashRegister() {
  const btnCloseCash = document.getElementById('btnCloseCashRegister');
  const btnEditBase = document.getElementById('btnEditBaseCash');
  const btnNewExpense = document.getElementById('btnRegisterExpenseModal');

  if (btnCloseCash) btnCloseCash.addEventListener('click', closeDailyCashRegister);
  if (btnEditBase) btnEditBase.addEventListener('click', editCashBase);
  if (btnNewExpense) btnNewExpense.addEventListener('click', openExpenseModal);

  initExpenseModal();
}

function updateQuickCajaBadge() {
  const today = getTodayIso();
  let todayCashSales = 0;

  appState.invoices.forEach(inv => {
    if (inv.status === 'anulada') return; // excluir anuladas
    (inv.payments || []).forEach(p => {
      if (p.date && p.date.startsWith(today) && p.method === 'efectivo') {
        todayCashSales += (Number(p.amount) || 0);
      }
    });
  });

  const todayExpenses = appState.expenses.filter(e => e.date.startsWith(today) && e.paymentMethod === 'efectivo').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const base = appState.cashRegister.baseCash || 0;
  const currentCashInDrawer = base + todayCashSales - todayExpenses;

  const quickTotal = document.getElementById('quickCajaTotal');
  if (quickTotal) quickTotal.textContent = formatMoney(currentCashInDrawer);
}

function renderCashRegisterView() {
  updateQuickCajaBadge();
  const today = getTodayIso();

  let cashSales = 0;
  let digitalSales = 0;

  appState.invoices.forEach(inv => {
    if (inv.status === 'anulada') return; // excluir anuladas del cuadre de caja
    (inv.payments || []).forEach(p => {
      if (p.date && p.date.startsWith(today)) {
        if (p.method === 'efectivo') {
          cashSales += (Number(p.amount) || 0);
        } else {
          digitalSales += (Number(p.amount) || 0);
        }
      }
    });
  });

  const todayExpenses = appState.expenses.filter(e => e.date.startsWith(today));
  const totalExpenses = todayExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const cashExpenses = todayExpenses.filter(e => e.paymentMethod === 'efectivo').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const base = appState.cashRegister.baseCash || 0;
  const expectedCash = base + cashSales - cashExpenses;

  document.getElementById('cajaBaseAmount').textContent = formatMoney(base);
  document.getElementById('cajaSalesCash').textContent = formatMoney(cashSales);
  document.getElementById('cajaSalesDigital').textContent = formatMoney(digitalSales);
  document.getElementById('cajaTotalExpenses').textContent = formatMoney(totalExpenses);
  document.getElementById('cajaExpectedCash').textContent = formatMoney(expectedCash);

  renderExpensesTable();
}

function editCashBase() {
  const current = appState.cashRegister.baseCash || 0;
  const input = prompt('Ingresa el monto de base en efectivo para iniciar la jornada:', current);
  if (input !== null) {
    const num = Number(input) || 0;
    appState.cashRegister.baseCash = num;
    saveState();
    renderCashRegisterView();
    showToast('Base de caja actualizada', 'success');
  }
}

function closeDailyCashRegister() {
  const today = getTodayIso();
  const todayInvoices = appState.invoices.filter(i => i.date.startsWith(today));
  const cashSales = todayInvoices.filter(i => i.paymentMethod === 'efectivo').reduce((acc, i) => acc + i.total, 0);
  const digitalSales = todayInvoices.filter(i => i.paymentMethod !== 'efectivo').reduce((acc, i) => acc + i.total, 0);
  const totalSales = cashSales + digitalSales;

  const todayExpenses = appState.expenses.filter(e => e.date.startsWith(today));
  const cashExpenses = todayExpenses.filter(e => e.paymentMethod === 'efectivo').reduce((acc, e) => acc + e.amount, 0);
  const base = appState.cashRegister.baseCash || 0;
  const expectedCash = base + cashSales - cashExpenses;

  const summary = `
════════════════════════════════
  CIERRE Y CUADRE DE CAJA DEL DÍA
════════════════════════════════
• Fecha: ${today}
• Base Inicial de Caja: ${formatMoney(base)}
• Ventas en Efectivo: ${formatMoney(cashSales)}
• Ventas Digitales (Tarj/Transf): ${formatMoney(digitalSales)}
• TOTAL FACTURADO: ${formatMoney(totalSales)}
• Salidas / Gastos en Efectivo: -${formatMoney(cashExpenses)}
────────────────────────────────
💵 EFECTIVO ESPERADO EN CAJA: ${formatMoney(expectedCash)}
════════════════════════════════
¿Confirmar cierre de caja?`;

  if (confirm(summary)) {
    showToast('Caja cerrada y arqueada con éxito. ¡Gran jornada!', 'success');
  }
}

function initExpenseModal() {
  const modal = document.getElementById('expenseModal');
  const btnClose = document.getElementById('btnCloseExpenseModal');
  const btnCancel = document.getElementById('btnCancelExpenseModal');
  const form = document.getElementById('expenseForm');

  if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('active'));
  if (btnCancel) btnCancel.addEventListener('click', () => modal.classList.remove('active'));

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('expTitle').value.trim();
      const category = document.getElementById('expCategory').value;
      const paymentMethod = document.getElementById('expPaymentMethod').value;
      const amount = Number(document.getElementById('expAmount').value) || 0;

      appState.expenses.unshift({
        id: 'exp-' + Date.now(),
        title,
        category,
        paymentMethod,
        amount,
        date: new Date().toISOString()
      });

      saveState();
      renderCashRegisterView();
      renderFiscalView();
      modal.classList.remove('active');
      form.reset();
      showToast('Gasto registrado', 'info');
    });
  }
}

function openExpenseModal() {
  document.getElementById('expenseModal').classList.add('active');
}

function renderExpensesTable() {
  const tbody = document.getElementById('expensesTableBody');
  if (!tbody) return;

  const today = getTodayIso();
  const todayExpenses = appState.expenses.filter(e => e.date.startsWith(today));

  if (todayExpenses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No hay gastos registrados el día de hoy.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = todayExpenses.map(exp => {
    const d = new Date(exp.date);
    const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    return `
      <tr>
        <td>${timeStr}</td>
        <td><strong>${escapeHtml(exp.title)}</strong></td>
        <td><span style="text-transform: capitalize;">${exp.category}</span></td>
        <td><span style="text-transform: capitalize;">${exp.paymentMethod}</span></td>
        <td class="text-right"><strong style="color: var(--rose);">${formatMoney(exp.amount)}</strong></td>
        <td class="text-center">
          <button class="btn-tbl-action" onclick="deleteExpense('${exp.id}')" title="Eliminar" style="color: var(--rose);">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.deleteExpense = function(expId) {
  if (confirm('¿Eliminar este registro de gasto?')) {
    appState.expenses = appState.expenses.filter(e => e.id !== expId);
    saveState();
    renderCashRegisterView();
    renderFiscalView();
    showToast('Gasto eliminado', 'info');
  }
};

// ==========================================================================
// 14. MÓDULO LIQUIDACIÓN DE COMISIONES DE ESTILISTAS
// ==========================================================================

function initCommissions() {
  const dateStart = document.getElementById('comisionesDateStart');
  const dateEnd = document.getElementById('comisionesDateEnd');
  const btnFilter = document.getElementById('btnFilterComisiones');
  const btnToday = document.getElementById('btnTodayComisiones');
  const btnExportPdf = document.getElementById('btnExportComisionesPdf');

  if (dateStart && dateEnd) {
    dateStart.value = getTodayIso();
    dateEnd.value = getTodayIso();
  }

  if (btnFilter) btnFilter.addEventListener('click', renderCommissionsView);
  if (btnToday) {
    btnToday.addEventListener('click', () => {
      dateStart.value = getTodayIso();
      dateEnd.value = getTodayIso();
      renderCommissionsView();
    });
  }

  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => window.print());
  }
}

function renderCommissionsView() {
  const grid = document.getElementById('stylistsCommissionsGrid');
  if (!grid) return;

  const dateStart = document.getElementById('comisionesDateStart') ? document.getElementById('comisionesDateStart').value : getTodayIso();
  const dateEnd = document.getElementById('comisionesDateEnd') ? document.getElementById('comisionesDateEnd').value : getTodayIso();

  const rangeInvoices = appState.invoices.filter(inv => {
    const invDate = inv.date.split('T')[0];
    return invDate >= dateStart && invDate <= dateEnd;
  });

  grid.innerHTML = appState.stylists.map(stylist => {
    const stylistInvoices = rangeInvoices.filter(i => i.stylistId === stylist.id);

    let totalServicesAmount = 0;
    let totalProductsAmount = 0;
    let serviceCommAmount = 0;
    let productCommAmount = 0;
    let clientCount = stylistInvoices.length;

    stylistInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const itemVal = item.price * item.qty;
        if (item.type === 'service') {
          totalServicesAmount += itemVal;
          serviceCommAmount += Math.round(itemVal * (stylist.serviceCommPercent / 100));
        } else {
          totalProductsAmount += itemVal;
          productCommAmount += Math.round(itemVal * (stylist.productCommPercent / 100));
        }
      });
    });

    const totalFacturado = totalServicesAmount + totalProductsAmount;
    const totalComisionPagar = serviceCommAmount + productCommAmount;

    return `
      <div class="stylist-comm-card">
        <div class="stylist-card-header">
          <div class="stylist-avatar">${stylist.initials || stylist.name.slice(0, 2)}</div>
          <div class="stylist-header-info">
            <h4>${escapeHtml(stylist.name)}</h4>
            <span>${escapeHtml(stylist.role)}</span>
          </div>
        </div>

        <div class="comm-breakdown">
          <div class="comm-row">
            <span>Clientas Atendidas:</span>
            <strong>${clientCount}</strong>
          </div>
          <div class="comm-row">
            <span>Servicios (${stylist.serviceCommPercent}%):</span>
            <span>${formatMoney(totalServicesAmount)} &rarr; <strong>${formatMoney(serviceCommAmount)}</strong></span>
          </div>
          <div class="comm-row">
            <span>Productos (${stylist.productCommPercent}%):</span>
            <span>${formatMoney(totalProductsAmount)} &rarr; <strong>${formatMoney(productCommAmount)}</strong></span>
          </div>
          <div class="comm-row">
            <span>Total Facturado por Estilista:</span>
            <span>${formatMoney(totalFacturado)}</span>
          </div>
          <div class="comm-total-row">
            <span>COMISIÓN A LIQUIDAR:</span>
            <span class="comm-total-highlight">${formatMoney(totalComisionPagar)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// 15. MÓDULO ESTADÍSTICAS POR CLIENTAS (CRM & ANALÍTICA)
// ==========================================================================

let clientStatsPeriod = 'all';
let clientStatsSearchQuery = '';

function initClientStats() {
  const searchInput = document.getElementById('clientSearchInput');
  const periodFilter = document.getElementById('clientPeriodFilter');
  const subtabBtns = document.querySelectorAll('.clientas-subtabs .client-subtab-btn');
  const btnExportCsv = document.getElementById('btnExportClientsCsv');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clientStatsSearchQuery = e.target.value.toLowerCase().trim();
      renderClientStatsView();
    });
  }

  if (periodFilter) {
    periodFilter.addEventListener('change', (e) => {
      clientStatsPeriod = e.target.value;
      renderClientStatsView();
    });
  }

  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subtabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.client-subpane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-subtab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
      initLucide();
    });
  });

  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', exportClientsStatsToCsv);
  }
}

function computeClientAnalytics() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const filteredInvoices = appState.invoices.filter(inv => {
    if (clientStatsPeriod === 'all') return true;
    const invDate = new Date(inv.date);
    if (clientStatsPeriod === 'year') {
      return invDate.getFullYear() === currentYear;
    }
    if (clientStatsPeriod === 'month') {
      return invDate.getFullYear() === currentYear && (invDate.getMonth() + 1) === currentMonth;
    }
    return true;
  });

  const clientsMap = {};

  function getOrCreateClient(name, phone) {
    const key = name.trim().toLowerCase();
    if (!clientsMap[key]) {
      clientsMap[key] = {
        name: name.trim(),
        phone: phone || '',
        totalSpent: 0,
        invoicesCount: 0,
        appointmentsCount: 0,
        completedAppointmentsCount: 0,
        lastVisitDate: null,
        servicesMap: {},
        stylistsMap: {}
      };
    }
    if (phone && !clientsMap[key].phone) clientsMap[key].phone = phone;
    return clientsMap[key];
  }

  filteredInvoices.forEach(inv => {
    const c = getOrCreateClient(inv.clientName, inv.clientPhone);
    c.totalSpent += inv.total;
    c.invoicesCount += 1;

    if (!c.lastVisitDate || new Date(inv.date) > new Date(c.lastVisitDate)) {
      c.lastVisitDate = inv.date;
    }

    if (inv.stylistName) {
      c.stylistsMap[inv.stylistName] = (c.stylistsMap[inv.stylistName] || 0) + 1;
    }

    inv.items.forEach(item => {
      c.servicesMap[item.name] = (c.servicesMap[item.name] || 0) + item.qty;
    });
  });

  appState.appointments.forEach(apt => {
    const c = getOrCreateClient(apt.clientName, apt.clientPhone);
    c.appointmentsCount += 1;
    if (apt.status === 'cobrada') {
      c.completedAppointmentsCount += 1;
    }
    if (!c.lastVisitDate || new Date(apt.date) > new Date(c.lastVisitDate)) {
      c.lastVisitDate = apt.date;
    }
    if (apt.serviceName) {
      c.servicesMap[apt.serviceName] = (c.servicesMap[apt.serviceName] || 0) + 1;
    }
  });

  const now = new Date();
  const clientsList = Object.values(clientsMap).map(c => {
    const avgTicket = c.invoicesCount > 0 ? Math.round(c.totalSpent / c.invoicesCount) : 0;

    let daysSinceLast = 999;
    if (c.lastVisitDate) {
      const last = new Date(c.lastVisitDate);
      const diffTime = Math.abs(now - last);
      daysSinceLast = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    let favService = 'Sin servicios';
    let maxSvcCount = 0;
    Object.entries(c.servicesMap).forEach(([sName, count]) => {
      if (count > maxSvcCount) {
        maxSvcCount = count;
        favService = sName;
      }
    });

    const attendanceRate = c.appointmentsCount > 0
      ? Math.round((c.completedAppointmentsCount / c.appointmentsCount) * 100)
      : (c.invoicesCount > 0 ? 100 : 0);

    return {
      ...c,
      avgTicket,
      daysSinceLast,
      favService,
      attendanceRate
    };
  });

  return clientsList;
}

function renderClientStatsView() {
  const clients = computeClientAnalytics();

  const filtered = clients.filter(c => {
    if (!clientStatsSearchQuery) return true;
    const matchName = c.name.toLowerCase().includes(clientStatsSearchQuery);
    const matchPhone = c.phone.toLowerCase().includes(clientStatsSearchQuery);
    return matchName || matchPhone;
  });

  const totalClients = clients.length;
  const sortedBySpending = [...clients].sort((a, b) => b.totalSpent - a.totalSpent);
  const topSpender = sortedBySpending[0] || null;

  const totalRevenue = clients.reduce((acc, c) => acc + c.totalSpent, 0);
  const avgTicketGlobal = totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0;
  const inactiveClients = clients.filter(c => c.daysSinceLast > 45);

  document.getElementById('metricTotalClients').textContent = totalClients;
  if (topSpender && topSpender.totalSpent > 0) {
    document.getElementById('metricTopClientName').textContent = topSpender.name;
    document.getElementById('metricTopClientTotal').textContent = formatMoney(topSpender.totalSpent);
  } else {
    document.getElementById('metricTopClientName').textContent = '—';
    document.getElementById('metricTopClientTotal').textContent = '$0';
  }
  document.getElementById('metricAvgClientTicket').textContent = formatMoney(avgTicketGlobal);
  document.getElementById('metricInactiveClientsCount').textContent = inactiveClients.length;

  // SUBTAB 1: TOP FACTURACIÓN (VIPs)
  const topBody = document.getElementById('topClientsTableBody');
  if (topBody) {
    const listTop = [...filtered].sort((a, b) => b.totalSpent - a.totalSpent);

    if (listTop.length === 0) {
      topBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">No se encontraron clientas.</td></tr>`;
    } else {
      topBody.innerHTML = listTop.map((c, index) => {
        let rankBadge = `<strong style="color:var(--text-muted); font-size:13px;">#${index + 1}</strong>`;
        let vipBadge = `<span class="badge-vip-bronze">Bronce</span>`;

        if (index === 0) {
          rankBadge = `<span class="medal-badge">🥇</span><strong>1º</strong>`;
          vipBadge = `<span class="badge-vip-gold">🏆 VIP Oro</span>`;
        } else if (index === 1) {
          rankBadge = `<span class="medal-badge">🥈</span><strong>2º</strong>`;
          vipBadge = `<span class="badge-vip-silver">🥈 Plata</span>`;
        } else if (index === 2) {
          rankBadge = `<span class="medal-badge">🥉</span><strong>3º</strong>`;
          vipBadge = `<span class="badge-vip-bronze">🥉 Bronce</span>`;
        }

        return `
          <tr>
            <td class="text-center">${rankBadge}</td>
            <td><strong>${escapeHtml(c.name)}</strong></td>
            <td><span style="font-size:12px; color:var(--text-secondary);">📱 ${escapeHtml(c.phone || 'Sin número')}</span></td>
            <td class="text-center"><span class="badge-counter" style="background:var(--navy-subtle); color:var(--navy); font-size:12px;">${c.invoicesCount} visitas</span></td>
            <td class="text-right">${formatMoney(c.avgTicket)}</td>
            <td class="text-right"><strong style="color:var(--emerald-dark); font-size:14px;">${formatMoney(c.totalSpent)}</strong></td>
            <td><span style="font-size:12px; color:var(--navy);">${escapeHtml(c.favService)}</span></td>
            <td class="text-center">${vipBadge}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // SUBTAB 2: MENOR CONSUMO / OCASIONALES
  const lowBody = document.getElementById('lowClientsTableBody');
  if (lowBody) {
    const listLow = [...filtered].sort((a, b) => a.totalSpent - b.totalSpent);

    if (listLow.length === 0) {
      lowBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No hay registros.</td></tr>`;
    } else {
      lowBody.innerHTML = listLow.map(c => {
        const cleanPhone = (c.phone || '').replace(/\D/g, '');
        const waMsg = encodeURIComponent(`¡Hola ${c.name}! En Visos Keratin te extrañamos mucho. Te tenemos una atención especial en tu próximo tratamiento o keratina. ¿Te gustaría agendar esta semana?`);
        const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waMsg}` : `https://wa.me/?text=${waMsg}`;
        const lastDateFormatted = c.lastVisitDate ? new Date(c.lastVisitDate).toLocaleDateString('es-ES') : 'Sin fecha';

        return `
          <tr>
            <td><strong>${escapeHtml(c.name)}</strong></td>
            <td><span style="font-size:12px; color:var(--text-muted);">${escapeHtml(c.phone || 'Sin WhatsApp')}</span></td>
            <td class="text-center">${c.invoicesCount}</td>
            <td class="text-right"><strong style="color:var(--gold);">${formatMoney(c.totalSpent)}</strong></td>
            <td><span style="font-size:12px;">${escapeHtml(c.favService)}</span></td>
            <td><span style="font-size:12px; color:var(--text-muted);">${lastDateFormatted} (${c.daysSinceLast < 900 ? c.daysSinceLast + ' días' : 'Reciente'})</span></td>
            <td class="text-center">
              <a href="${waUrl}" target="_blank" class="btn-reactivate-wa" title="Escribir promoción por WhatsApp">
                <span>📲 Promo WhatsApp</span>
              </a>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // SUBTAB 3: AGENDAMIENTOS & FRECUENCIA
  const aptBody = document.getElementById('appointmentsClientsTableBody');
  if (aptBody) {
    const listApt = [...filtered].sort((a, b) => b.appointmentsCount - a.appointmentsCount);

    if (listApt.length === 0) {
      aptBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">No hay agendamientos registrados.</td></tr>`;
    } else {
      aptBody.innerHTML = listApt.map(c => {
        let retentionStatusBadge = `<span class="badge-retention-ok">🟢 Frecuente (${c.daysSinceLast} d)</span>`;
        if (c.daysSinceLast > 60) {
          retentionStatusBadge = `<span class="badge-retention-risk">🔴 Inactiva (${c.daysSinceLast} d)</span>`;
        } else if (c.daysSinceLast > 30) {
          retentionStatusBadge = `<span class="badge-retention-warn">🟡 En Riesgo (${c.daysSinceLast} d)</span>`;
        }

        const lastDateFormatted = c.lastVisitDate ? new Date(c.lastVisitDate).toLocaleDateString('es-ES') : '—';

        return `
          <tr>
            <td><strong>${escapeHtml(c.name)}</strong></td>
            <td><span style="font-size:12px; color:var(--text-muted);">${escapeHtml(c.phone || '—')}</span></td>
            <td class="text-center"><strong style="font-size:13px; color:var(--navy);">${c.appointmentsCount}</strong></td>
            <td class="text-center"><strong style="color:var(--emerald-dark);">${c.completedAppointmentsCount}</strong></td>
            <td class="text-center">${c.attendanceRate}%</td>
            <td><span style="font-size:12px;">${lastDateFormatted}</span></td>
            <td class="text-center">${retentionStatusBadge}</td>
            <td class="text-center">
              <button class="btn-tbl-action" onclick="quickScheduleForClient('${escapeHtml(c.name)}', '${escapeHtml(c.phone)}')">
                📅 Agendar
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  initLucide();
}

window.quickScheduleForClient = function(clientName, clientPhone) {
  openAppointmentModal();
  const inputName = document.getElementById('aptClientName');
  const inputPhone = document.getElementById('aptClientPhone');
  if (inputName) inputName.value = clientName;
  if (inputPhone) inputPhone.value = clientPhone;
};

function exportClientsStatsToCsv() {
  const clients = computeClientAnalytics();
  if (clients.length === 0) {
    showToast('No hay estadísticas de clientas para exportar', 'warning');
    return;
  }

  let csv = 'Clienta,Telefono,Total_Facturado,Numero_Visitas,Ticket_Promedio,Citas_Agendadas,Citas_Cumplidas,Tasa_Asistencia_Pct,Ultima_Visita,Servicio_Favorito\n';
  clients.forEach(c => {
    csv += `"${c.name}","${c.phone}",${c.totalSpent},${c.invoicesCount},${c.avgTicket},${c.appointmentsCount},${c.completedAppointmentsCount},${c.attendanceRate},"${c.lastVisitDate || ''}","${c.favService}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Estadisticas_Clientas_VisosKeratin_${getTodayIso()}.csv`);
  link.click();
  showToast('Estadísticas de clientas exportadas a Excel', 'success');
}

// ==========================================================================
// 16. MÓDULO DECLARACIÓN TRIBUTARIA DIAN (MES & AÑO)
// ==========================================================================

let fiscalSelectedYear = 2026;
let fiscalSelectedMonth = 'all';
let fiscalMovementsSearch = '';

function initFiscalModule() {
  const yearSelect = document.getElementById('fiscalYearSelect');
  const monthSelect = document.getElementById('fiscalMonthSelect');
  const btnExportPdf = document.getElementById('btnExportFiscalPdf');
  const btnExportCsv = document.getElementById('btnExportFiscalCsv');
  const searchInput = document.getElementById('fiscalMovementsSearch');

  if (yearSelect) {
    yearSelect.value = String(fiscalSelectedYear);
    yearSelect.addEventListener('change', (e) => {
      fiscalSelectedYear = Number(e.target.value);
      renderFiscalView();
    });
  }

  if (monthSelect) {
    monthSelect.value = fiscalSelectedMonth;
    monthSelect.addEventListener('change', (e) => {
      fiscalSelectedMonth = e.target.value;
      renderFiscalView();
    });
  }

  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', exportFiscalDianPdf);
  }

  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', exportFiscalDianCsv);
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      fiscalMovementsSearch = e.target.value.toLowerCase().trim();
      renderFiscalMovementsTable();
    });
  }
}

function computeFiscalData(targetYear, targetMonth = 'all') {
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const monthlyBreakdown = [];
  for (let m = 1; m <= 12; m++) {
    monthlyBreakdown.push({
      monthIndex: m,
      monthName: monthNames[m - 1],
      invoicesCount: 0,
      serviceIncome: 0,
      retailIncome: 0,
      grossIncome: 0,
      discounts: 0,
      netIncome: 0,
      costsAndExpenses: 0,
      costSupplies: 0,
      commissions: 0,
      operationalExpenses: 0,
      netTaxableIncome: 0
    });
  }

  appState.invoices.forEach(inv => {
    const d = new Date(inv.date);
    if (d.getFullYear() === targetYear) {
      const mIdx = d.getMonth();
      const monthObj = monthlyBreakdown[mIdx];

      monthObj.invoicesCount += 1;
      monthObj.discounts += (inv.discount || 0);
      monthObj.grossIncome += inv.total;
      monthObj.commissions += (inv.stylistCommission || 0);

      inv.items.forEach(item => {
        const itemVal = item.price * item.qty;
        if (item.type === 'service') {
          monthObj.serviceIncome += itemVal;
        } else {
          monthObj.retailIncome += itemVal;
          monthObj.costSupplies += (item.cost || 0) * item.qty;
        }
      });
    }
  });

  appState.expenses.forEach(exp => {
    const d = new Date(exp.date);
    if (d.getFullYear() === targetYear) {
      const mIdx = d.getMonth();
      const monthObj = monthlyBreakdown[mIdx];
      monthObj.operationalExpenses += exp.amount;
    }
  });

  monthlyBreakdown.forEach(m => {
    m.costsAndExpenses = m.costSupplies + m.commissions + m.operationalExpenses;
    m.netTaxableIncome = m.grossIncome - m.costsAndExpenses;
  });

  const yearTotals = {
    invoicesCount: monthlyBreakdown.reduce((a, b) => a + b.invoicesCount, 0),
    serviceIncome: monthlyBreakdown.reduce((a, b) => a + b.serviceIncome, 0),
    retailIncome: monthlyBreakdown.reduce((a, b) => a + b.retailIncome, 0),
    grossIncome: monthlyBreakdown.reduce((a, b) => a + b.grossIncome, 0),
    discounts: monthlyBreakdown.reduce((a, b) => a + b.discounts, 0),
    costSupplies: monthlyBreakdown.reduce((a, b) => a + b.costSupplies, 0),
    commissions: monthlyBreakdown.reduce((a, b) => a + b.commissions, 0),
    operationalExpenses: monthlyBreakdown.reduce((a, b) => a + b.operationalExpenses, 0),
    costsAndExpenses: monthlyBreakdown.reduce((a, b) => a + b.costsAndExpenses, 0),
    netTaxableIncome: monthlyBreakdown.reduce((a, b) => a + b.netTaxableIncome, 0)
  };

  return { monthlyBreakdown, yearTotals };
}

function renderFiscalView() {
  const { monthlyBreakdown, yearTotals } = computeFiscalData(fiscalSelectedYear, fiscalSelectedMonth);

  let displayData = yearTotals;
  const tableTitle = document.getElementById('fiscalTableTitle');

  if (fiscalSelectedMonth !== 'all') {
    const mNum = Number(fiscalSelectedMonth);
    displayData = monthlyBreakdown[mNum - 1] || yearTotals;
    if (tableTitle) {
      tableTitle.textContent = `Consolidado de ${displayData.monthName} ${fiscalSelectedYear}`;
    }
  } else {
    if (tableTitle) {
      tableTitle.textContent = `Consolidado Mensual del Año Gravable ${fiscalSelectedYear}`;
    }
  }

  document.getElementById('fiscalIngresosBrutos').textContent = formatMoney(displayData.grossIncome);
  document.getElementById('fiscalIngresosServicios').textContent = formatMoney(displayData.serviceIncome);
  document.getElementById('fiscalIngresosProductos').textContent = formatMoney(displayData.retailIncome);

  document.getElementById('fiscalDescuentos').textContent = `-${formatMoney(displayData.discounts)}`;

  document.getElementById('fiscalCostosDeducciones').textContent = formatMoney(displayData.costsAndExpenses);
  document.getElementById('fiscalCostoInsumos').textContent = formatMoney(displayData.costSupplies);
  document.getElementById('fiscalComisiones').textContent = formatMoney(displayData.commissions);
  document.getElementById('fiscalGastosOp').textContent = formatMoney(displayData.operationalExpenses);

  const rentaLiqEl = document.getElementById('fiscalRentaLiquida');
  rentaLiqEl.textContent = formatMoney(displayData.netTaxableIncome);
  rentaLiqEl.style.color = displayData.netTaxableIncome >= 0 ? 'var(--gold)' : 'var(--rose)';

  const tbody = document.getElementById('fiscalMonthlyTableBody');
  const tfoot = document.getElementById('fiscalMonthlyTableFoot');

  if (tbody) {
    tbody.innerHTML = monthlyBreakdown.map(m => {
      const marginPct = m.grossIncome > 0 ? Math.round((m.netTaxableIncome / m.grossIncome) * 100) : 0;
      const isSelected = fiscalSelectedMonth !== 'all' && String(m.monthIndex) === fiscalSelectedMonth;

      return `
        <tr style="${isSelected ? 'background: var(--gold-pale); font-weight: 600;' : ''}">
          <td><strong>${m.monthName}</strong></td>
          <td class="text-center">${m.invoicesCount}</td>
          <td class="text-right">${formatMoney(m.serviceIncome)}</td>
          <td class="text-right">${formatMoney(m.retailIncome)}</td>
          <td class="text-right"><strong style="color:var(--emerald-dark);">${formatMoney(m.grossIncome)}</strong></td>
          <td class="text-right" style="color:var(--rose);">${formatMoney(m.costsAndExpenses)}</td>
          <td class="text-right">
            <strong style="color:${m.netTaxableIncome >= 0 ? 'var(--navy)' : 'var(--rose)'};">
              ${formatMoney(m.netTaxableIncome)}
            </strong>
          </td>
          <td class="text-center">
            <span class="badge-stock ${marginPct >= 20 ? 'badge-stock-ok' : 'badge-stock-low'}">
              ${marginPct}%
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (tfoot) {
    const totalMarginPct = yearTotals.grossIncome > 0
      ? Math.round((yearTotals.netTaxableIncome / yearTotals.grossIncome) * 100)
      : 0;

    tfoot.innerHTML = `
      <tr>
        <td>TOTAL CONSOLIDADO ${fiscalSelectedYear}</td>
        <td class="text-center">${yearTotals.invoicesCount}</td>
        <td class="text-right">${formatMoney(yearTotals.serviceIncome)}</td>
        <td class="text-right">${formatMoney(yearTotals.retailIncome)}</td>
        <td class="text-right"><strong style="color:var(--emerald-dark); font-size:14px;">${formatMoney(yearTotals.grossIncome)}</strong></td>
        <td class="text-right" style="color:var(--rose); font-size:14px;">${formatMoney(yearTotals.costsAndExpenses)}</td>
        <td class="text-right">
          <strong style="color:var(--gold); font-size:15px;">
            ${formatMoney(yearTotals.netTaxableIncome)}
          </strong>
        </td>
        <td class="text-center"><span class="badge-stock badge-stock-ok">${totalMarginPct}%</span></td>
      </tr>
    `;
  }

  renderFiscalMovementsTable();
  initLucide();
}

function renderFiscalMovementsTable() {
  const tbody = document.getElementById('fiscalMovementsTableBody');
  if (!tbody) return;

  const allOps = [];

  appState.invoices.forEach(inv => {
    const d = new Date(inv.date);
    if (d.getFullYear() === fiscalSelectedYear) {
      if (fiscalSelectedMonth === 'all' || String(d.getMonth() + 1) === fiscalSelectedMonth) {
        allOps.push({
          date: inv.date,
          type: 'Ingreso (Factura)',
          voucher: inv.number,
          thirdParty: inv.clientName,
          concept: inv.items.map(i => `${i.qty}x ${i.name}`).join(', '),
          paymentMethod: inv.paymentMethod,
          income: inv.total,
          expense: 0
        });
      }
    }
  });

  appState.expenses.forEach(exp => {
    const d = new Date(exp.date);
    if (d.getFullYear() === fiscalSelectedYear) {
      if (fiscalSelectedMonth === 'all' || String(d.getMonth() + 1) === fiscalSelectedMonth) {
        allOps.push({
          date: exp.date,
          type: 'Egreso (Gasto)',
          voucher: exp.id.slice(0, 10).toUpperCase(),
          thirdParty: 'Proveedor / Salón',
          concept: exp.title,
          paymentMethod: exp.paymentMethod,
          income: 0,
          expense: exp.amount
        });
      }
    }
  });

  allOps.sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredOps = allOps.filter(op => {
    if (!fiscalMovementsSearch) return true;
    const matchThird = op.thirdParty.toLowerCase().includes(fiscalMovementsSearch);
    const matchConcept = op.concept.toLowerCase().includes(fiscalMovementsSearch);
    const matchVoucher = op.voucher.toLowerCase().includes(fiscalMovementsSearch);
    return matchThird || matchConcept || matchVoucher;
  });

  if (filteredOps.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">
          No hay movimientos para el período fiscal seleccionado.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredOps.map(op => {
    const dateFormatted = new Date(op.date).toLocaleDateString('es-ES') + ' ' + new Date(op.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    return `
      <tr>
        <td><span style="font-size:12px; color:var(--text-muted);">${dateFormatted}</span></td>
        <td>
          <span class="badge-stock ${op.income > 0 ? 'badge-stock-ok' : 'badge-stock-out'}" style="font-size:10.5px;">
            ${op.type}
          </span>
        </td>
        <td><strong>${op.voucher}</strong></td>
        <td><strong>${escapeHtml(op.thirdParty)}</strong></td>
        <td><span style="font-size:12px;">${escapeHtml(op.concept)}</span></td>
        <td><span style="text-transform:capitalize; font-size:12px;">${op.paymentMethod}</span></td>
        <td class="text-right">
          ${op.income > 0 ? `<strong style="color:var(--emerald-dark);">${formatMoney(op.income)}</strong>` : '—'}
        </td>
        <td class="text-right">
          ${op.expense > 0 ? `<strong style="color:var(--rose);">${formatMoney(op.expense)}</strong>` : '—'}
        </td>
      </tr>
    `;
  }).join('');
}

function exportFiscalDianPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast('Cargando motor de PDF...', 'warning');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const { monthlyBreakdown, yearTotals } = computeFiscalData(fiscalSelectedYear, fiscalSelectedMonth);

  doc.setFillColor(27, 43, 75);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(212, 160, 23);
  doc.text(appState.config.salonName || 'VISOS KERATIN', 14, 16);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`NIT: ${appState.config.nit || ''} • Tel: ${appState.config.phone || ''} • ${appState.config.address || ''}`, 14, 23);
  doc.text('DOCUMENTO SOPORTE CONTABLE PARA DECLARACIÓN DE RENTA DIAN', 14, 30);

  doc.setFontSize(13);
  doc.setTextColor(212, 160, 23);
  doc.text(`AÑO GRAVABLE ${fiscalSelectedYear}`, 196, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Emitido: ${new Date().toLocaleDateString('es-ES')}`, 196, 26, { align: 'right' });

  doc.setFontSize(11);
  doc.setTextColor(27, 43, 75);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DE RENGLONES PARA LA DECLARACIÓN DE RENTA', 14, 48);

  const renglonesRows = [
    ['Ingresos Brutos por Servicios Prestados', formatMoney(yearTotals.serviceIncome)],
    ['Ingresos Brutos por Venta de Productos Retail', formatMoney(yearTotals.retailIncome)],
    ['TOTAL INGRESOS BRUTOS FISCALES', formatMoney(yearTotals.grossIncome)],
    ['Menos: Descuentos y Rebajas en Venta', `-${formatMoney(yearTotals.discounts)}`],
    ['Costo de Insumos y Mercancía Vendida (Deducible)', formatMoney(yearTotals.costSupplies)],
    ['Comisiones y Honorarios Pagados a Estilistas (Deducible)', formatMoney(yearTotals.commissions)],
    ['Gastos Operativos (Arrendamiento, Servicios Públicos)', formatMoney(yearTotals.operationalExpenses)],
    ['TOTAL COSTOS Y DEDUCCIONES PROCEDENTES', formatMoney(yearTotals.costsAndExpenses)],
    ['RENTA LÍQUIDA ORDINARIA ESTIMADA (BASE GRAVABLE)', formatMoney(yearTotals.netTaxableIncome)]
  ];

  doc.autoTable({
    startY: 52,
    body: renglonesRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 135 },
      1: { cellWidth: 47, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: function(data) {
      if (data.row.index === 2 || data.row.index === 7 || data.row.index === 8) {
        data.cell.styles.fillColor = [240, 244, 250];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.row.index === 8) {
        data.cell.styles.textColor = [180, 83, 9];
      }
    }
  });

  const tableY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setTextColor(27, 43, 75);
  doc.setFont('helvetica', 'bold');
  doc.text(`DESGLOSE MENSUAL ENERO A DICIEMBRE ${fiscalSelectedYear}`, 14, tableY);

  const monthRows = monthlyBreakdown.map(m => [
    m.monthName,
    m.invoicesCount,
    formatMoney(m.serviceIncome),
    formatMoney(m.retailIncome),
    formatMoney(m.grossIncome),
    formatMoney(m.costsAndExpenses),
    formatMoney(m.netTaxableIncome)
  ]);

  monthRows.push([
    `TOTALES ${fiscalSelectedYear}`,
    yearTotals.invoicesCount,
    formatMoney(yearTotals.serviceIncome),
    formatMoney(yearTotals.retailIncome),
    formatMoney(yearTotals.grossIncome),
    formatMoney(yearTotals.costsAndExpenses),
    formatMoney(yearTotals.netTaxableIncome)
  ]);

  doc.autoTable({
    startY: tableY + 4,
    head: [['Mes', 'Facturas', 'Servicios', 'Retail', 'Ingreso Bruto', 'Deducciones', 'Renta Líquida']],
    body: monthRows,
    theme: 'striped',
    headStyles: { fillColor: [27, 43, 75], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: function(data) {
      if (data.row.index === monthRows.length - 1) {
        data.cell.styles.fillColor = [212, 160, 23];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  const signY = doc.lastAutoTable.finalY + 16;
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  doc.line(20, signY, 85, signY);
  doc.text('Firma Representante Legal / Propietaria', 20, signY + 5);
  doc.text(`C.C. ___________________`, 20, signY + 10);

  doc.line(125, signY, 190, signY);
  doc.text('Firma Contador Público / Revisor Fiscal', 125, signY + 5);
  doc.text('T.P. ___________________', 125, signY + 10);

  doc.save(`Informe_DIAN_${appState.config.salonName || 'Visos'}_${fiscalSelectedYear}.pdf`);
  showToast(`Certificado fiscal DIAN ${fiscalSelectedYear} descargado en PDF`, 'success');
}

function exportFiscalDianCsv() {
  const { monthlyBreakdown, yearTotals } = computeFiscalData(fiscalSelectedYear, fiscalSelectedMonth);

  let csv = `INFORME FISCAL DIAN - ${appState.config.salonName} - ANO ${fiscalSelectedYear}\n`;
  csv += `NIT: ${appState.config.nit}\n\n`;
  csv += 'Mes,Facturas_Emitidas,Ingresos_Servicios,Ingresos_Retail,Total_Ingresos_Brutos,Descuentos,Costos_Insumos,Comisiones_Nomina,Gastos_Operativos,Total_Costos_Deducciones,Renta_Liquida_Utilidad\n';

  monthlyBreakdown.forEach(m => {
    csv += `"${m.monthName}",${m.invoicesCount},${m.serviceIncome},${m.retailIncome},${m.grossIncome},${m.discounts},${m.costSupplies},${m.commissions},${m.operationalExpenses},${m.costsAndExpenses},${m.netTaxableIncome}\n`;
  });

  csv += `"TOTAL_ANUAL",${yearTotals.invoicesCount},${yearTotals.serviceIncome},${yearTotals.retailIncome},${yearTotals.grossIncome},${yearTotals.discounts},${yearTotals.costSupplies},${yearTotals.commissions},${yearTotals.operationalExpenses},${yearTotals.costsAndExpenses},${yearTotals.netTaxableIncome}\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Consolidado_Fiscal_DIAN_${fiscalSelectedYear}.csv`);
  link.click();
  showToast('Consolidado fiscal exportado a Excel (CSV)', 'success');
}

// ==========================================================================
// 17. MÓDULO REPORTES GENERALES & UTILIDAD NETA
// ==========================================================================

function initReports() {}

function renderReportsView() {
  const totalIncome = appState.invoices.reduce((acc, i) => acc + i.total, 0);
  const salesCount = appState.invoices.length;

  let totalCostSold = 0;
  appState.invoices.forEach(i => {
    i.items.forEach(item => {
      totalCostSold += (item.cost || 0) * item.qty;
    });
  });

  const totalCommissions = appState.invoices.reduce((acc, i) => acc + (i.stylistCommission || 0), 0);
  const totalExpenses = appState.expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalIncome - totalCostSold - totalCommissions - totalExpenses;

  document.getElementById('kpiTotalIncome').textContent = formatMoney(totalIncome);
  document.getElementById('kpiSalesCount').textContent = `${salesCount} transacciones`;
  document.getElementById('kpiCostoMercancia').textContent = formatMoney(totalCostSold);
  document.getElementById('kpiTotalComisiones').textContent = formatMoney(totalCommissions);
  document.getElementById('kpiTotalGastos').textContent = formatMoney(totalExpenses);
  document.getElementById('kpiUtilidadNeta').textContent = formatMoney(netProfit);

  const serviceCounts = {};
  appState.invoices.forEach(inv => {
    inv.items.filter(i => i.type === 'service').forEach(item => {
      serviceCounts[item.name] = (serviceCounts[item.name] || 0) + item.qty;
    });
  });

  const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topServicesList = document.getElementById('topServicesList');
  if (topServicesList) {
    if (sortedServices.length === 0) {
      topServicesList.innerHTML = '<span style="color:var(--text-muted); font-size:12px;">Sin datos aún</span>';
    } else {
      topServicesList.innerHTML = sortedServices.map(([name, count]) => `
        <div class="ranking-item">
          <span class="ranking-item-name">${escapeHtml(name)}</span>
          <span class="ranking-item-count">${count} realizados</span>
        </div>
      `).join('');
    }
  }

  const productCounts = {};
  appState.invoices.forEach(inv => {
    inv.items.filter(i => i.type === 'product').forEach(item => {
      productCounts[item.name] = (productCounts[item.name] || 0) + item.qty;
    });
  });

  const sortedProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topProductsList = document.getElementById('topProductsList');
  if (topProductsList) {
    if (sortedProducts.length === 0) {
      topProductsList.innerHTML = '<span style="color:var(--text-muted); font-size:12px;">Sin datos aún</span>';
    } else {
      topProductsList.innerHTML = sortedProducts.map(([name, count]) => `
        <div class="ranking-item">
          <span class="ranking-item-name">${escapeHtml(name)}</span>
          <span class="ranking-item-count">${count} vendidos</span>
        </div>
      `).join('');
    }
  }
}

// ==========================================================================
// 18. MÓDULO CONFIGURACIÓN & COPIA DE SEGURIDAD
// ==========================================================================

function initConfig() {
  const btnSaveSalon = document.getElementById('btnSaveSalonConfig');
  const btnAddStylist = document.getElementById('btnAddStylistConfig');
  const btnTestApi = document.getElementById('btnTestApiConnection');
  const btnDownloadBackup = document.getElementById('btnDownloadBackup');
  const inputRestore = document.getElementById('inputRestoreBackup');

  document.getElementById('cfgSalonName').value = appState.config.salonName || 'VISOS KERATIN';
  document.getElementById('cfgSalonSlogan').value = appState.config.slogan || '';
  document.getElementById('cfgSalonNit').value = appState.config.nit || '';
  document.getElementById('cfgSalonPhone').value = appState.config.phone || '';
  const adminPhoneInput = document.getElementById('cfgAdminPhone');
  if (adminPhoneInput) adminPhoneInput.value = appState.config.adminPhone || appState.config.phone || '+57 3166390429';
  const defaultMarginInput = document.getElementById('cfgDefaultMargin');
  if (defaultMarginInput) defaultMarginInput.value = appState.config.defaultMargin !== undefined ? appState.config.defaultMargin : 50;

  document.getElementById('cfgSalonAddress').value = appState.config.address || '';
  document.getElementById('cfgCurrencySymbol').value = appState.config.currency || '$';
  document.getElementById('cfgInvoiceFooter').value = appState.config.invoiceFooter || '';
  document.getElementById('cfgFirebaseUrl').value = appState.config.firebaseUrl || 'https://visos-keratin-default-rtdb.firebaseio.com';

  if (btnSaveSalon) {
    btnSaveSalon.addEventListener('click', () => {
      appState.config.salonName = document.getElementById('cfgSalonName').value.trim();
      appState.config.slogan = document.getElementById('cfgSalonSlogan').value.trim();
      appState.config.nit = document.getElementById('cfgSalonNit').value.trim();
      appState.config.phone = document.getElementById('cfgSalonPhone').value.trim();
      if (document.getElementById('cfgAdminPhone')) {
        appState.config.adminPhone = document.getElementById('cfgAdminPhone').value.trim();
      }
      if (document.getElementById('cfgDefaultMargin')) {
        appState.config.defaultMargin = Number(document.getElementById('cfgDefaultMargin').value) || 50;
      }
      appState.config.address = document.getElementById('cfgSalonAddress').value.trim();
      appState.config.currency = document.getElementById('cfgCurrencySymbol').value.trim() || '$';
      appState.config.invoiceFooter = document.getElementById('cfgInvoiceFooter').value.trim();
      appState.config.firebaseUrl = document.getElementById('cfgFirebaseUrl').value.trim();

      saveState();
      document.getElementById('sideSalonName').textContent = appState.config.salonName;
      showToast('Configuración del salón guardada', 'success');
    });
  }

  if (btnAddStylist) {
    btnAddStylist.addEventListener('click', () => {
      const name = prompt('Nombre del nuevo estilista:');
      if (name && name.trim()) {
        const id = 'e' + (appState.stylists.length + 1);
        appState.stylists.push({
          id,
          name: name.trim(),
          role: 'Estilista',
          serviceCommPercent: 45,
          productCommPercent: 10,
          initials: name.trim().slice(0, 2).toUpperCase()
        });
        saveState();
        renderStylistsConfig();
        populateStylistSelects();
        showToast('Estilista añadido', 'success');
      }
    });
  }

  if (btnTestApi) btnTestApi.addEventListener('click', syncAppointmentsFromVisos);
  if (btnDownloadBackup) btnDownloadBackup.addEventListener('click', downloadBackupJson);
  if (inputRestore) inputRestore.addEventListener('change', restoreBackupFromJson);
}

function renderStylistsConfig() {
  const container = document.getElementById('stylistsConfigList');
  if (!container) return;

  container.innerHTML = appState.stylists.map((st, idx) => `
    <div class="stylist-config-row">
      <strong style="width: 140px;">${escapeHtml(st.name)}</strong>
      <div style="display:flex; align-items:center; gap:4px;">
        <span style="font-size:11px;">Comisión Servicio:</span>
        <input type="number" min="0" max="100" value="${st.serviceCommPercent}" style="width:65px;" onchange="updateStylistComm(${idx}, 'service', this.value)">%
      </div>
      <div style="display:flex; align-items:center; gap:4px;">
        <span style="font-size:11px;">Comisión Producto:</span>
        <input type="number" min="0" max="100" value="${st.productCommPercent}" style="width:65px;" onchange="updateStylistComm(${idx}, 'product', this.value)">%
      </div>
    </div>
  `).join('');
}

window.updateStylistComm = function(index, type, val) {
  const num = Number(val) || 0;
  if (type === 'service') {
    appState.stylists[index].serviceCommPercent = num;
  } else {
    appState.stylists[index].productCommPercent = num;
  }
  saveState();
  showToast('Porcentaje de comisión actualizado', 'success');
};

function downloadBackupJson() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `CopiaSeguridad_VisosKeratin_${getTodayIso()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Copia de seguridad descargada', 'success');
}

function restoreBackupFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && parsed.products && parsed.services) {
        if (confirm('¿Restaurar esta copia de seguridad? Se reemplazarán los datos actuales.')) {
          appState = parsed;
          saveState();
          location.reload();
        }
      } else {
        showToast('El archivo no tiene el formato correcto', 'error');
      }
    } catch (err) {
      showToast('Error al leer el archivo de copia de seguridad', 'error');
    }
  };
  reader.readAsText(file);
}

// ==========================================================================
// 19. UTILIDADES (TOAST & ESCAPING)
// ==========================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-octagon';
  if (type === 'warning') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="width: 18px; height: 18px; flex-shrink: 0;"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  initLucide();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================================================
// 20. MÓDULO DE SINCRONIZACIÓN EN LA NUBE CON FIREBASE RTDB (VISOS KERATIN)
// ==========================================================================

let isSyncingCloud = false;
let cloudSyncDebounceTimer = null;

function scheduleCloudSync() {
  if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
  cloudSyncDebounceTimer = setTimeout(() => {
    pushToFirebase(false);
  }, 1500);
}

function updateCloudIndicator(status, message) {
  const dot = document.getElementById('cloudIndicatorDot');
  const label = document.getElementById('cloudStatusLabel');
  const cfgTime = document.getElementById('cfgLastSyncTime');

  if (dot) {
    dot.className = `cloud-indicator-dot ${status}`;
  }
  if (label) {
    if (status === 'online') label.textContent = 'En Línea (BD Visos)';
    else if (status === 'syncing') label.textContent = 'Sincronizando...';
    else label.textContent = 'Modo Local';
  }
  if (cfgTime && message) {
    cfgTime.textContent = message;
  }
}

async function pushToFirebase(showToastNotice = false) {
  const firebaseUrl = (appState.config && appState.config.firebaseUrl) || 'https://visos-keratin-default-rtdb.firebaseio.com';
  if (!firebaseUrl) return;

  updateCloudIndicator('syncing');

  try {
    const payload = {
      config: appState.config,
      products: appState.products,
      services: appState.services,
      stylists: appState.stylists,
      invoices: appState.invoices,
      supplierInvoices: appState.supplierInvoices || [],
      expenses: appState.expenses,
      appointments: appState.appointments,
      inventoryMovements: appState.inventoryMovements || [],
      cashRegister: appState.cashRegister,
      lastUpdated: new Date().toISOString()
    };

    const res = await fetch(`${firebaseUrl}/sistema_contable.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const nowStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateCloudIndicator('online', `Último respaldo en la nube: Hoy a las ${nowStr}`);
    if (showToastNotice) {
      showToast('¡Copia maestra guardada con éxito en la base de datos de Visos Keratin!', 'success');
    }
  } catch (err) {
    console.warn('No fue posible sincronizar con Firebase:', err);
    updateCloudIndicator('offline', 'Sin conexión con la nube. Operando en modo local seguro.');
    if (showToastNotice) {
      showToast('Aviso: No se pudo contactar Firebase. Se guardó localmente.', 'warning');
    }
  }
}

async function pullFromFirebase(interactive = false) {
  const firebaseUrl = (appState.config && appState.config.firebaseUrl) || 'https://visos-keratin-default-rtdb.firebaseio.com';
  if (!firebaseUrl) return;

  updateCloudIndicator('syncing');
  if (interactive) showToast('Conectando con la base de datos de Visos Keratin...', 'info');

  try {
    const res = await fetch(`${firebaseUrl}/sistema_contable.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data) {
      await pushToFirebase(false);
      updateCloudIndicator('online', 'Conectado a Visos Keratin (Inicializado)');
      if (interactive) showToast('Base de datos en la nube inicializada con tus datos locales.', 'success');
      return;
    }

    if (data.products && Array.isArray(data.products) && data.products.length > 0) {
      const localProductsMap = new Map(appState.products.map(p => [p.id, p]));
      data.products.forEach(p => {
        if (!localProductsMap.has(p.id)) {
          appState.products.push(p);
        }
      });
    }

    if (data.services && Array.isArray(data.services) && data.services.length > 0) {
      const localSvcMap = new Map(appState.services.map(s => [s.id, s]));
      data.services.forEach(s => {
        if (!localSvcMap.has(s.id)) {
          appState.services.push(s);
        }
      });
    }

    if (data.invoices && Array.isArray(data.invoices)) {
      const localInvIds = new Set(appState.invoices.map(i => i.id || i.number));
      data.invoices.forEach(inv => {
        if (!localInvIds.has(inv.id || inv.number)) {
          appState.invoices.push(inv);
        }
      });
      appState.invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    if (data.supplierInvoices && Array.isArray(data.supplierInvoices)) {
      const localSupIds = new Set((appState.supplierInvoices || []).map(s => s.id || s.invoiceNumber));
      if (!appState.supplierInvoices) appState.supplierInvoices = [];
      data.supplierInvoices.forEach(sup => {
        if (!localSupIds.has(sup.id || sup.invoiceNumber)) {
          appState.supplierInvoices.push(sup);
        }
      });
      appState.supplierInvoices.sort((a, b) => new Date(b.issueDate || b.date) - new Date(a.issueDate || a.date));
    }

    if (data.expenses && Array.isArray(data.expenses)) {
      const localExpIds = new Set(appState.expenses.map(e => e.id));
      data.expenses.forEach(exp => {
        if (!localExpIds.has(exp.id)) appState.expenses.push(exp);
      });
    }

    saveState();
    refreshAllDataViews();

    const nowStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateCloudIndicator('online', `Sincronizado con BD Visos: Hoy ${nowStr}`);
    if (interactive) showToast('¡Sincronización con la nube completada con éxito!', 'success');
  } catch (err) {
    console.warn('Error al leer de Firebase:', err);
    updateCloudIndicator('offline', 'Modo local activo (sin conexión a Firebase)');
    if (interactive) showToast('No se pudo conectar a la base de datos. Operando localmente.', 'warning');
  }
}

function initCloudSyncService() {
  const btnTopCloud = document.getElementById('btnCloudSyncStatus');
  const btnSyncNow = document.getElementById('btnSyncCloudNow');
  const btnPushMaster = document.getElementById('btnPushToCloudMaster');
  const btnPullMaster = document.getElementById('btnPullFromCloudMaster');

  if (btnTopCloud) {
    btnTopCloud.addEventListener('click', () => pullFromFirebase(true));
  }
  if (btnSyncNow) {
    btnSyncNow.addEventListener('click', () => pullFromFirebase(true));
  }
  if (btnPushMaster) {
    btnPushMaster.addEventListener('click', () => pushToFirebase(true));
  }
  if (btnPullMaster) {
    btnPullMaster.addEventListener('click', () => {
      if (confirm('¿Descargar y sincronizar todos los datos maestros desde la base de datos en la nube?')) {
        pullFromFirebase(true);
      }
    });
  }

  setTimeout(() => {
    pullFromFirebase(false);
  }, 1200);
}

// ==========================================================================
// 21. MÓDULO DE FACTURAS DIGITALES DE PROVEEDORES & CUENTAS POR PAGAR
// ==========================================================================

let stagedSupplierItems = [];

function initSupplierInvoiceModule() {
  // Manejo de subpestañas de inventario
  const btnStock = document.getElementById('btnSubtabStock');
  const btnSuppliers = document.getElementById('btnSubtabSuppliers');
  const paneStock = document.getElementById('inv-subpane-stock');
  const paneSuppliers = document.getElementById('inv-subpane-suppliers');

  if (btnStock && btnSuppliers && paneStock && paneSuppliers) {
    btnStock.addEventListener('click', () => {
      btnStock.classList.add('active');
      btnSuppliers.classList.remove('active');
      paneStock.style.display = 'block';
      paneSuppliers.style.display = 'none';
      renderInventoryTable();
    });

    btnSuppliers.addEventListener('click', () => {
      btnSuppliers.classList.add('active');
      btnStock.classList.remove('active');
      paneSuppliers.style.display = 'block';
      paneStock.style.display = 'none';
      renderSupplierInvoicesTable();
    });
  }

  // Modales de Proveedores
  const btnOpenModal1 = document.getElementById('btnOpenSupplierInvoiceModal');
  const btnOpenModal2 = document.getElementById('btnOpenSupplierInvoiceModal2');
  const btnCloseModal = document.getElementById('btnCloseSupplierInvoiceModal');
  const btnCancelModal = document.getElementById('btnCancelSupplierInvoiceModal');
  const btnConfirmInvoice = document.getElementById('btnConfirmSupplierInvoice');
  const btnAddManualRow = document.getElementById('btnAddManualSupplierRow');
  const btnApplyMargin = document.getElementById('btnApplyGlobalMargin');

  if (btnOpenModal1) btnOpenModal1.addEventListener('click', openSupplierInvoiceModal);
  if (btnOpenModal2) btnOpenModal2.addEventListener('click', openSupplierInvoiceModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeSupplierInvoiceModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeSupplierInvoiceModal);
  if (btnConfirmInvoice) btnConfirmInvoice.addEventListener('click', confirmSupplierInvoice);
  if (btnAddManualRow) btnAddManualRow.addEventListener('click', addManualSupplierItemRow);
  if (btnApplyMargin) btnApplyMargin.addEventListener('click', applyGlobalMarginToStagedItems);

  // Manejador de condición de pago en factura de proveedor
  const termSelect = document.getElementById('supFormPaymentTerm');
  if (termSelect) {
    termSelect.addEventListener('change', () => {
      const wrap = document.getElementById('supFormInitialPayWrap');
      if (wrap) {
        wrap.style.display = (termSelect.value === 'abono' || termSelect.value === 'pagada') ? 'block' : 'none';
      }
      recalculateSupplierInvoiceTotals();
    });
  }

  const initialPayInput = document.getElementById('supFormInitialPayment');
  if (initialPayInput) {
    initialPayInput.addEventListener('input', recalculateSupplierInvoiceTotals);
  }

  const discountInput = document.getElementById('supFormDiscountPercent');
  if (discountInput) {
    discountInput.addEventListener('input', recalculateSupplierInvoiceTotals);
  }

  // Dropzone de archivo digital
  const fileInput = document.getElementById('supplierFileInput');
  const dropzone = document.getElementById('supplierDropzone');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleSupplierFileUpload(e.target.files[0]);
      }
    });
  }

  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#047857';
      dropzone.style.background = '#CCFBF1';
    });
    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#0D9488';
      dropzone.style.background = '#F0FDFA';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#0D9488';
      dropzone.style.background = '#F0FDFA';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleSupplierFileUpload(e.dataTransfer.files[0]);
      }
    });
  }

  // Filtros de tabla de proveedores
  const supProviderFilter = document.getElementById('supplierProviderFilter');
  const supStatusFilter = document.getElementById('supplierStatusFilter');
  const supSearchInput = document.getElementById('supplierSearchInput');

  if (supProviderFilter) supProviderFilter.addEventListener('change', renderSupplierInvoicesTable);
  if (supStatusFilter) supStatusFilter.addEventListener('change', renderSupplierInvoicesTable);
  if (supSearchInput) supSearchInput.addEventListener('input', renderSupplierInvoicesTable);

  // Modal de abono a proveedor
  const btnCloseSupPay = document.getElementById('btnCloseSupplierPaymentModal');
  const btnCancelSupPay = document.getElementById('btnCancelSupplierPaymentModal');
  const supPayForm = document.getElementById('supplierPaymentForm');
  const btnPayFull = document.getElementById('btnPaySupFull');

  if (btnCloseSupPay) btnCloseSupPay.addEventListener('click', closeSupplierPaymentModal);
  if (btnCancelSupPay) btnCancelSupPay.addEventListener('click', closeSupplierPaymentModal);
  if (supPayForm) supPayForm.addEventListener('submit', saveSupplierPayment);

  if (btnPayFull) {
    btnPayFull.addEventListener('click', () => {
      const invId = document.getElementById('paySupInvoiceId').value;
      const inv = (appState.supplierInvoices || []).find(s => s.id === invId);
      if (inv) {
        document.getElementById('paySupAmount').value = inv.balanceDue;
      }
    });
  }

  // Botón consolidado de deudas a WhatsApp
  const btnSendAllDebts = document.getElementById('btnSendAllDebtsSummaryWhatsApp');
  if (btnSendAllDebts) {
    btnSendAllDebts.addEventListener('click', sendAllDebtsSummaryWhatsApp);
  }

  // Modal de detalle de factura de proveedor
  const btnCloseSupDetail = document.getElementById('btnCloseSupplierInvoiceDetailModal');
  const btnCancelSupDetail = document.getElementById('btnCancelSupplierInvoiceDetailModal');
  if (btnCloseSupDetail) btnCloseSupDetail.addEventListener('click', () => document.getElementById('supplierInvoiceDetailModal').classList.remove('active'));
  if (btnCancelSupDetail) btnCancelSupDetail.addEventListener('click', () => document.getElementById('supplierInvoiceDetailModal').classList.remove('active'));
}

function openSupplierInvoiceModal() {
  const modal = document.getElementById('supplierInvoiceModal');
  if (!modal) return;

  stagedSupplierItems = [];
  document.getElementById('supplierFileName').style.display = 'none';
  document.getElementById('supplierFileInput').value = '';
  document.getElementById('supFormName').value = '';
  document.getElementById('supFormNumber').value = '';

  const today = getTodayIso();
  document.getElementById('supFormIssueDate').value = today;

  const due = new Date();
  due.setDate(due.getDate() + 30);
  document.getElementById('supFormDueDate').value = due.toISOString().split('T')[0];

  document.getElementById('supFormDiscountPercent').value = 0;
  document.getElementById('supFormPaymentTerm').value = 'credito';
  document.getElementById('supFormInitialPayment').value = 0;
  document.getElementById('supFormInitialPayWrap').style.display = 'none';

  const defMargin = appState.config.defaultMargin !== undefined ? appState.config.defaultMargin : 50;
  document.getElementById('supGlobalMargin').value = defMargin;

  // Llenar datalist de proveedores
  populateProvidersDatalist();

  // Agregar 2 filas vacías por defecto para entrada manual asistida
  addManualSupplierItemRow();
  addManualSupplierItemRow();

  modal.classList.add('active');
  initLucide();
}

function closeSupplierInvoiceModal() {
  const modal = document.getElementById('supplierInvoiceModal');
  if (modal) modal.classList.remove('active');
}

function populateProvidersDatalist() {
  const datalist = document.getElementById('providersDataList');
  if (!datalist) return;

  const known = new Set(['Distribuidora Capilar', 'L\'Oréal Professionnel', 'Kativa Professional', 'Saloon Pro Colombia', 'Insumos de Belleza SAS']);
  (appState.supplierInvoices || []).forEach(s => {
    if (s.providerName) known.add(s.providerName);
  });

  datalist.innerHTML = Array.from(known).map(p => `<option value="${escapeHtml(p)}"></option>`).join('');
}

async function handleSupplierFileUpload(file) {
  const nameEl = document.getElementById('supplierFileName');
  if (nameEl) {
    nameEl.textContent = `📄 Archivo cargado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    nameEl.style.display = 'block';
  }

  showToast(`Procesando factura digital: ${file.name}...`, 'info');

  const ext = file.name.split('.').pop().toLowerCase();

  try {
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      await parseExcelSupplierFile(file);
    } else if (ext === 'pdf') {
      await parsePdfSupplierFile(file);
    } else {
      await parseTextSupplierFile(file);
    }
  } catch (err) {
    console.error('Error procesando archivo digital:', err);
    showToast('No se pudieron extraer automáticamente los datos. Puedes ingresarlos en la tabla.', 'warning');
  }
}

async function parseExcelSupplierFile(file) {
  if (!window.XLSX) {
    showToast('Librería de Excel cargando, por favor intenta en unos segundos.', 'warning');
    return;
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  const extracted = [];
  const defMargin = Number(document.getElementById('supGlobalMargin').value) || 50;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Buscar celda de texto que parezca nombre de producto
    let desc = '';
    let qty = 0;
    let cost = 0;

    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      if (typeof val === 'string' && val.trim().length > 3 && !desc) {
        const lower = val.toLowerCase();
        if (!lower.includes('factura') && !lower.includes('fecha') && !lower.includes('nit') && !lower.includes('total') && !lower.includes('subtotal') && !lower.includes('direccion') && !lower.includes('cliente') && !lower.includes('proveedor')) {
          desc = val.trim();
        }
      } else if (typeof val === 'number') {
        if (val > 0 && val <= 500 && qty === 0) {
          qty = Math.round(val);
        } else if (val > 500 && cost === 0) {
          cost = Math.round(val);
        }
      }
    }

    if (desc && cost > 0) {
      if (qty === 0) qty = 1;
      const matched = findBestProductMatch(desc);
      const netCost = cost;
      const suggestedPrice = Math.round((netCost * (1 + defMargin / 100)) / 1000) * 1000;

      extracted.push({
        id: 'tmp-' + Math.random().toString(36).substr(2, 6),
        name: desc,
        qty,
        grossCost: cost,
        netCost,
        marginPercent: defMargin,
        suggestedPrice,
        matchedProductId: matched ? matched.id : null,
        isNew: !matched
      });
    }
  }

  if (extracted.length > 0) {
    stagedSupplierItems = extracted;
    renderSupplierItemsMapping();
    showToast(`¡Se extrajeron ${extracted.length} productos del archivo Excel con éxito!`, 'success');
  } else {
    showToast('Archivo leído. Puedes ajustar los datos directamente en la tabla.', 'info');
  }
}

async function parsePdfSupplierFile(file) {
  if (!window.pdfjsLib) {
    showToast('Lector de PDF aún cargando, espera un momento...', 'warning');
    return;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join(' ') + '\n';
  }

  // Analizar texto extraído
  const lines = fullText.split('\n');
  const extracted = [];
  const defMargin = Number(document.getElementById('supGlobalMargin').value) || 50;

  lines.forEach(line => {
    line = line.trim();
    if (line.length < 5) return;

    // Buscar patrones tipo: "10 Shampoo Post Keratina 20000" o "Shampoo ... 10 ... 20000"
    const numbers = line.match(/\d+([.,]\d+)?/g);
    if (numbers && numbers.length >= 2) {
      const cleanDesc = line.replace(/\d+([.,]\d+)?/g, '').replace(/[$#]/g, '').trim();
      if (cleanDesc.length > 3) {
        const num1 = parseFloat(numbers[0].replace(',', '.'));
        const num2 = parseFloat(numbers[numbers.length - 1].replace(/[,.]/g, ''));

        let qty = num1 < 200 ? Math.round(num1) : 1;
        let cost = num2 > 1000 ? num2 : (num1 > 1000 ? num1 : 0);

        if (cost > 0) {
          const matched = findBestProductMatch(cleanDesc);
          const netCost = cost;
          const suggestedPrice = Math.round((netCost * (1 + defMargin / 100)) / 1000) * 1000;

          extracted.push({
            id: 'tmp-' + Math.random().toString(36).substr(2, 6),
            name: cleanDesc,
            qty,
            grossCost: cost,
            netCost,
            marginPercent: defMargin,
            suggestedPrice,
            matchedProductId: matched ? matched.id : null,
            isNew: !matched
          });
        }
      }
    }
  });

  if (extracted.length > 0) {
    stagedSupplierItems = extracted;
    renderSupplierItemsMapping();
    showToast(`¡Se extrajeron ${extracted.length} líneas del PDF! Revisa y ajusta los valores.`, 'success');
  } else {
    showToast('PDF analizado. Ingresa o ajusta los productos en la tabla asistida.', 'info');
  }
}

async function parseTextSupplierFile(file) {
  const text = await file.text();
  const lines = text.split('\n');
  const extracted = [];
  const defMargin = Number(document.getElementById('supGlobalMargin').value) || 50;

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;
    const parts = line.split(/[;,\t]/);
    if (parts.length >= 2) {
      const desc = parts[0].trim();
      const qty = Number(parts[1]) || 1;
      const cost = Number(parts[2]) || (Number(parts[1]) > 500 ? Number(parts[1]) : 0);

      if (desc && cost > 0) {
        const matched = findBestProductMatch(desc);
        const netCost = cost;
        const suggestedPrice = Math.round((netCost * (1 + defMargin / 100)) / 1000) * 1000;

        extracted.push({
          id: 'tmp-' + Math.random().toString(36).substr(2, 6),
          name: desc,
          qty,
          grossCost: cost,
          netCost,
          marginPercent: defMargin,
          suggestedPrice,
          matchedProductId: matched ? matched.id : null,
          isNew: !matched
        });
      }
    }
  });

  if (extracted.length > 0) {
    stagedSupplierItems = extracted;
    renderSupplierItemsMapping();
  }
}

function findBestProductMatch(name) {
  if (!name || !appState.products) return null;
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const words = clean.split(' ').filter(w => w.length > 3);

  return appState.products.find(p => {
    const pName = p.name.toLowerCase();
    return words.some(w => pName.includes(w));
  }) || null;
}

function addManualSupplierItemRow() {
  const defMargin = Number(document.getElementById('supGlobalMargin').value) || 50;
  stagedSupplierItems.push({
    id: 'tmp-' + Math.random().toString(36).substr(2, 6),
    name: '',
    qty: 1,
    grossCost: 0,
    netCost: 0,
    marginPercent: defMargin,
    suggestedPrice: 0,
    matchedProductId: null,
    isNew: true
  });
  renderSupplierItemsMapping();
}

function removeSupplierStagedItem(idx) {
  stagedSupplierItems.splice(idx, 1);
  renderSupplierItemsMapping();
}

function applyGlobalMarginToStagedItems() {
  const margin = Number(document.getElementById('supGlobalMargin').value) || 50;
  stagedSupplierItems.forEach(item => {
    item.marginPercent = margin;
    item.suggestedPrice = Math.round((item.netCost * (1 + margin / 100)) / 1000) * 1000;
  });
  renderSupplierItemsMapping();
  showToast(`Margen del ${margin}% aplicado a todos los productos.`, 'success');
}

function renderSupplierItemsMapping() {
  const tbody = document.getElementById('supplierItemsTableBody');
  const countEl = document.getElementById('supDetectedItemsCount');
  if (!tbody) return;

  if (countEl) countEl.textContent = stagedSupplierItems.length;

  const discountPercent = Number(document.getElementById('supFormDiscountPercent').value) || 0;

  tbody.innerHTML = stagedSupplierItems.map((item, idx) => {
    // Calcular costo neto con el descuento del proveedor
    item.netCost = Math.round(item.grossCost * (1 - discountPercent / 100));
    if (!item.suggestedPrice || item.suggestedPrice === 0) {
      item.suggestedPrice = Math.round((item.netCost * (1 + (item.marginPercent || 50) / 100)) / 1000) * 1000;
    }

    const rowSubtotal = item.netCost * item.qty;

    return `
      <tr>
        <td>
          <input type="text" value="${escapeHtml(item.name)}" placeholder="Nombre del producto" 
            onchange="updateStagedSupplierItem(${idx}, 'name', this.value)" style="width:100%; font-size:12px; padding:4px 6px;">
        </td>
        <td>
          <input type="number" min="1" value="${item.qty}" 
            onchange="updateStagedSupplierItem(${idx}, 'qty', this.value)" style="width:100%; text-align:right; font-size:12px; padding:4px 6px;">
        </td>
        <td>
          <input type="number" min="0" value="${item.grossCost}" 
            onchange="updateStagedSupplierItem(${idx}, 'grossCost', this.value)" style="width:100%; text-align:right; font-size:12px; padding:4px 6px;">
        </td>
        <td class="text-right" style="font-weight:700; color:#0F766E; font-size:12px;">
          ${formatMoney(item.netCost)}
        </td>
        <td>
          <input type="number" min="0" max="500" value="${item.marginPercent}" 
            onchange="updateStagedSupplierItem(${idx}, 'marginPercent', this.value)" style="width:100%; text-align:right; font-size:12px; padding:4px 6px;">
        </td>
        <td>
          <input type="number" min="0" value="${item.suggestedPrice}" 
            onchange="updateStagedSupplierItem(${idx}, 'suggestedPrice', this.value)" style="width:100%; text-align:right; font-size:12px; font-weight:700; color:#B45309; padding:4px 6px;">
        </td>
        <td>
          <select onchange="updateStagedSupplierItem(${idx}, 'matchedProductId', this.value)" style="font-size:11.5px; width:100%; padding:3px 4px;">
            <option value="new" ${item.isNew ? 'selected' : ''}>✨ Crear como Producto Nuevo</option>
            <optgroup label="♻️ Sumar Stock a Producto Existente:">
              ${appState.products.map(p => `
                <option value="${p.id}" ${item.matchedProductId === p.id ? 'selected' : ''}>
                  ${escapeHtml(p.name)} (Stock actual: ${p.stock})
                </option>
              `).join('')}
            </optgroup>
          </select>
        </td>
        <td class="text-right" style="font-weight:700; font-size:12px;">
          ${formatMoney(rowSubtotal)}
        </td>
        <td class="text-center">
          <button type="button" class="btn-tbl-action" onclick="removeSupplierStagedItem(${idx})" style="color:var(--rose); padding:2px 6px;" title="Eliminar fila">✕</button>
        </td>
      </tr>
    `;
  }).join('');

  recalculateSupplierInvoiceTotals();
}

window.updateStagedSupplierItem = function(idx, field, val) {
  if (!stagedSupplierItems[idx]) return;

  if (field === 'name') {
    stagedSupplierItems[idx].name = val.trim();
  } else if (field === 'qty') {
    stagedSupplierItems[idx].qty = Math.max(1, Number(val) || 1);
  } else if (field === 'grossCost') {
    stagedSupplierItems[idx].grossCost = Math.max(0, Number(val) || 0);
    const discount = Number(document.getElementById('supFormDiscountPercent').value) || 0;
    stagedSupplierItems[idx].netCost = Math.round(stagedSupplierItems[idx].grossCost * (1 - discount / 100));
    stagedSupplierItems[idx].suggestedPrice = Math.round((stagedSupplierItems[idx].netCost * (1 + stagedSupplierItems[idx].marginPercent / 100)) / 1000) * 1000;
  } else if (field === 'marginPercent') {
    stagedSupplierItems[idx].marginPercent = Math.max(0, Number(val) || 0);
    stagedSupplierItems[idx].suggestedPrice = Math.round((stagedSupplierItems[idx].netCost * (1 + stagedSupplierItems[idx].marginPercent / 100)) / 1000) * 1000;
  } else if (field === 'suggestedPrice') {
    stagedSupplierItems[idx].suggestedPrice = Math.max(0, Number(val) || 0);
  } else if (field === 'matchedProductId') {
    if (val === 'new') {
      stagedSupplierItems[idx].matchedProductId = null;
      stagedSupplierItems[idx].isNew = true;
    } else {
      stagedSupplierItems[idx].matchedProductId = val;
      stagedSupplierItems[idx].isNew = false;
    }
  }

  renderSupplierItemsMapping();
};

window.removeSupplierStagedItem = removeSupplierStagedItem;

function recalculateSupplierInvoiceTotals() {
  const discountPercent = Number(document.getElementById('supFormDiscountPercent').value) || 0;
  const term = document.getElementById('supFormPaymentTerm').value;
  let grossSum = 0;

  stagedSupplierItems.forEach(item => {
    grossSum += (Number(item.grossCost) || 0) * (Number(item.qty) || 1);
  });

  const discountAmount = Math.round(grossSum * (discountPercent / 100));
  const netTotal = Math.max(0, grossSum - discountAmount);

  let initialPay = 0;
  if (term === 'pagada') {
    initialPay = netTotal;
    const initialInput = document.getElementById('supFormInitialPayment');
    if (initialInput) initialInput.value = initialPay;
  } else if (term === 'abono') {
    const initialInput = document.getElementById('supFormInitialPayment');
    initialPay = Math.max(0, Math.min(netTotal, Number(initialInput ? initialInput.value : 0) || 0));
  } else {
    initialPay = 0;
    const initialInput = document.getElementById('supFormInitialPayment');
    if (initialInput) initialInput.value = 0;
  }

  const balanceDue = Math.max(0, netTotal - initialPay);

  const sumGrossEl = document.getElementById('supSumGross');
  const sumDiscEl = document.getElementById('supSumDiscount');
  const sumTotEl = document.getElementById('supSumTotal');
  const sumBalEl = document.getElementById('supSumBalance');

  if (sumGrossEl) sumGrossEl.textContent = formatMoney(grossSum);
  if (sumDiscEl) sumDiscEl.textContent = `-${formatMoney(discountAmount)} (${discountPercent}%)`;
  if (sumTotEl) sumTotEl.textContent = formatMoney(netTotal);
  if (sumBalEl) sumBalEl.textContent = formatMoney(balanceDue);
}

function confirmSupplierInvoice() {
  const providerName = document.getElementById('supFormName').value.trim();
  const invoiceNumber = document.getElementById('supFormNumber').value.trim();
  const issueDate = document.getElementById('supFormIssueDate').value;
  const dueDate = document.getElementById('supFormDueDate').value;
  const discountPercent = Number(document.getElementById('supFormDiscountPercent').value) || 0;
  const term = document.getElementById('supFormPaymentTerm').value;

  if (!providerName) {
    showToast('Ingresa el nombre del proveedor', 'warning');
    return;
  }
  if (!invoiceNumber) {
    showToast('Ingresa el número de factura del proveedor', 'warning');
    return;
  }
  if (!dueDate) {
    showToast('Ingresa la fecha límite de pago', 'warning');
    return;
  }

  const validItems = stagedSupplierItems.filter(i => i.name.trim() && i.grossCost > 0 && i.qty > 0);
  if (validItems.length === 0) {
    showToast('Agrega al menos un producto con nombre, cantidad y costo válido', 'warning');
    return;
  }

  let grossSum = 0;
  validItems.forEach(i => {
    grossSum += i.grossCost * i.qty;
  });
  const discountAmount = Math.round(grossSum * (discountPercent / 100));
  const netTotal = Math.max(0, grossSum - discountAmount);

  let initialPay = 0;
  if (term === 'pagada') {
    initialPay = netTotal;
  } else if (term === 'abono') {
    initialPay = Math.max(0, Math.min(netTotal, Number(document.getElementById('supFormInitialPayment').value) || 0));
  }
  const balanceDue = Math.max(0, netTotal - initialPay);

  // 1. Actualizar inventario en tiempo real
  let updatedStockCount = 0;
  let newProductsCreated = 0;

  validItems.forEach(item => {
    if (!item.isNew && item.matchedProductId) {
      const prod = appState.products.find(p => p.id === item.matchedProductId);
      if (prod) {
        prod.stock += item.qty;
        prod.cost = item.netCost;
        if (item.suggestedPrice > 0) prod.price = item.suggestedPrice;
        updatedStockCount++;

        appState.inventoryMovements.push({
          id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          productId: prod.id,
          productName: prod.name,
          type: 'compra',
          qty: item.qty,
          date: new Date().toISOString(),
          reason: `Factura Proveedor ${providerName} #${invoiceNumber}`
        });
      }
    } else {
      const newId = 'prd-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      let cat = 'shampoos';
      const lower = item.name.toLowerCase();
      if (lower.includes('kera') || lower.includes('alisa')) cat = 'keratinas';
      else if (lower.includes('tinte') || lower.includes('ox') || lower.includes('color')) cat = 'tintes';
      else if (lower.includes('tratam') || lower.includes('masc') || lower.includes('botox') || lower.includes('aceite')) cat = 'tratamientos';
      else if (lower.includes('cepillo') || lower.includes('toalla') || lower.includes('capa')) cat = 'accesorios';

      appState.products.push({
        id: newId,
        sku: 'VK-' + (appState.products.length + 1).toString().padStart(3, '0'),
        name: item.name,
        type: 'retail',
        category: cat,
        stock: item.qty,
        minStock: 3,
        cost: item.netCost,
        price: item.suggestedPrice > 0 ? item.suggestedPrice : Math.round(item.netCost * 1.5)
      });
      newProductsCreated++;

      appState.inventoryMovements.push({
        id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        productId: newId,
        productName: item.name,
        type: 'compra',
        qty: item.qty,
        date: new Date().toISOString(),
        reason: `Creación por Factura ${providerName} #${invoiceNumber}`
      });
    }
  });

  // 2. Registrar en Cuentas por Pagar a Proveedores
  const payments = [];
  if (initialPay > 0) {
    payments.push({
      id: 'pay-sup-' + Date.now(),
      date: new Date().toISOString(),
      amount: initialPay,
      method: 'transferencia',
      note: 'Abono / Pago inicial en cargue de factura'
    });

    // Si se pagó de contado o hubo abono inicial, se puede registrar como egreso
    appState.expenses.push({
      id: 'exp-' + Date.now(),
      date: new Date().toISOString(),
      category: 'proveedores',
      title: `Pago/Abono a Factura Proveedor ${providerName} #${invoiceNumber}`,
      amount: initialPay,
      paymentMethod: 'transferencia'
    });
  }

  const supplierInv = {
    id: 'sup-inv-' + Date.now(),
    providerName,
    invoiceNumber,
    issueDate,
    dueDate,
    discountPercent,
    grossAmount: grossSum,
    discountAmount,
    totalAmount: netTotal,
    paidAmount: initialPay,
    balanceDue,
    status: balanceDue === 0 ? 'pagada' : (initialPay > 0 ? 'parcial' : 'pendiente'),
    items: validItems,
    payments,
    createdAt: new Date().toISOString()
  };

  if (!appState.supplierInvoices) appState.supplierInvoices = [];
  appState.supplierInvoices.unshift(supplierInv);

  saveState();
  closeSupplierInvoiceModal();

  renderInventoryTable();
  renderSupplierInvoicesTable();
  renderExpensesTable();

  showToast(`¡Factura #${invoiceNumber} procesada! ${updatedStockCount} productos actualizados, ${newProductsCreated} nuevos creados.`, 'success');
}

function renderSupplierInvoicesTable() {
  const tbody = document.getElementById('supplierInvoicesTableBody');
  if (!tbody) return;

  const invoices = appState.supplierInvoices || [];

  // Métricas
  const totalDebt = invoices.reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);

  let dueSoonCount = 0;
  let overdueCount = 0;
  let paidCount = 0;

  invoices.forEach(inv => {
    if (inv.balanceDue <= 0) {
      paidCount++;
    } else {
      const due = new Date(inv.dueDate);
      if (due < now) {
        overdueCount++;
      } else if (due <= next7Days) {
        dueSoonCount++;
      }
    }
  });

  const debtEl = document.getElementById('metricTotalSupplierDebt');
  const soonEl = document.getElementById('metricDueSoonSupplierCount');
  const overEl = document.getElementById('metricOverdueSupplierCount');
  const paidEl = document.getElementById('metricPaidSupplierCount');
  const badgeCounter = document.getElementById('badgePendingSupplierInvoices');

  if (debtEl) debtEl.textContent = formatMoney(totalDebt);
  if (soonEl) soonEl.textContent = dueSoonCount;
  if (overEl) overEl.textContent = overdueCount;
  if (paidEl) paidEl.textContent = paidCount;
  if (badgeCounter) {
    const pendingTotal = invoices.filter(i => i.balanceDue > 0).length;
    badgeCounter.textContent = pendingTotal;
    badgeCounter.style.display = pendingTotal > 0 ? 'inline-block' : 'none';
  }

  // Poblar filtro de proveedores
  const providerFilter = document.getElementById('supplierProviderFilter');
  if (providerFilter && providerFilter.options.length <= 1) {
    const providers = Array.from(new Set(invoices.map(i => i.providerName).filter(Boolean)));
    providers.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      providerFilter.appendChild(opt);
    });
  }

  const selectedProv = providerFilter ? providerFilter.value : 'all';
  const statusFilter = document.getElementById('supplierStatusFilter')?.value || 'pending_all';
  const searchQuery = (document.getElementById('supplierSearchInput')?.value || '').toLowerCase().trim();

  const filtered = invoices.filter(inv => {
    if (selectedProv !== 'all' && inv.providerName !== selectedProv) return false;
    if (searchQuery) {
      const matchProv = (inv.providerName || '').toLowerCase().includes(searchQuery);
      const matchNum = (inv.invoiceNumber || '').toLowerCase().includes(searchQuery);
      if (!matchProv && !matchNum) return false;
    }

    const due = new Date(inv.dueDate);
    if (statusFilter === 'pending_all' && inv.balanceDue <= 0) return false;
    if (statusFilter === 'overdue' && (inv.balanceDue <= 0 || due >= now)) return false;
    if (statusFilter === 'paid' && inv.balanceDue > 0) return false;

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
          No se encontraron facturas de proveedores con los filtros seleccionados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(inv => {
    const due = new Date(inv.dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    let dueBadgeHtml = '';
    if (inv.balanceDue <= 0) {
      dueBadgeHtml = `<span class="badge-due-tag paid">Pagada</span>`;
    } else if (diffDays < 0) {
      dueBadgeHtml = `<span class="badge-due-tag overdue">⚠️ Vencida hace ${Math.abs(diffDays)} días</span>`;
    } else if (diffDays <= 7) {
      dueBadgeHtml = `<span class="badge-due-tag soon">🟡 Vence en ${diffDays} días</span>`;
    } else {
      dueBadgeHtml = `<span class="badge-due-tag ok">🟢 Al día (${diffDays} días)</span>`;
    }

    return `
      <tr>
        <td><strong>${escapeHtml(inv.providerName)}</strong></td>
        <td>${escapeHtml(inv.invoiceNumber)}</td>
        <td>${inv.issueDate || '—'}</td>
        <td>
          <strong>${inv.dueDate || '—'}</strong><br>
          ${dueBadgeHtml}
        </td>
        <td class="text-right">${formatMoney(inv.totalAmount)}</td>
        <td class="text-right" style="color:#059669; font-weight:700;">${formatMoney(inv.paidAmount || 0)}</td>
        <td class="text-right" style="color:${inv.balanceDue > 0 ? '#DC2626' : '#059669'}; font-weight:800; font-size:13.5px;">
          ${formatMoney(inv.balanceDue)}
        </td>
        <td class="text-center">
          ${inv.balanceDue <= 0
            ? '<span class="badge-stock badge-stock-ok">Paz y Salvo</span>'
            : (inv.paidAmount > 0
                ? '<span class="badge-stock badge-stock-low" style="background:#FEF3C7; color:#B45309; border-color:#FCD34D;">Parcial</span>'
                : '<span class="badge-stock badge-stock-low" style="background:#FEE2E2; color:#DC2626; border-color:#FCA5A5;">Pendiente</span>')
          }
        </td>
        <td class="text-center">
          <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap;">
            ${inv.balanceDue > 0 ? `
              <button class="btn-tbl-action" onclick="openSupplierPaymentModal('${inv.id}')" style="color:#059669; font-weight:700; border-color:#059669;" title="Registrar Abono">
                💸 Abonar
              </button>
              <button class="btn-tbl-action" onclick="sendSupplierDebtWhatsAppReminder('${inv.id}')" style="color:#0284C7; font-weight:700; border-color:#0284C7;" title="Recordatorio por WhatsApp al Administrador">
                📲 WhatsApp
              </button>
            ` : ''}
            <button class="btn-tbl-action" onclick="openSupplierInvoiceDetailModal('${inv.id}')" title="Ver Detalle de Productos">
              👁️ Ver
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openSupplierPaymentModal = function(invoiceId) {
  const inv = (appState.supplierInvoices || []).find(s => s.id === invoiceId);
  if (!inv) return;

  const modal = document.getElementById('supplierPaymentModal');
  document.getElementById('paySupInvoiceId').value = inv.id;
  document.getElementById('paySupInvoiceSummary').textContent = `${inv.providerName} — Factura #${inv.invoiceNumber} (Total: ${formatMoney(inv.totalAmount)})`;
  document.getElementById('paySupCurrentBalance').textContent = formatMoney(inv.balanceDue);
  document.getElementById('paySupDate').value = getTodayIso();
  document.getElementById('paySupAmount').value = inv.balanceDue;
  document.getElementById('paySupNote').value = '';

  modal.classList.add('active');
  initLucide();
};

function closeSupplierPaymentModal() {
  const modal = document.getElementById('supplierPaymentModal');
  if (modal) modal.classList.remove('active');
}

function saveSupplierPayment(e) {
  e.preventDefault();
  const invoiceId = document.getElementById('paySupInvoiceId').value;
  const inv = (appState.supplierInvoices || []).find(s => s.id === invoiceId);
  if (!inv) return;

  const amount = Number(document.getElementById('paySupAmount').value) || 0;
  const date = document.getElementById('paySupDate').value;
  const method = document.getElementById('paySupMethod').value;
  const note = document.getElementById('paySupNote').value.trim();

  if (amount <= 0 || amount > inv.balanceDue) {
    showToast('El monto a abonar debe ser mayor a 0 y no exceder el saldo pendiente', 'warning');
    return;
  }

  inv.paidAmount = (inv.paidAmount || 0) + amount;
  inv.balanceDue = Math.max(0, inv.totalAmount - inv.paidAmount);
  inv.status = inv.balanceDue === 0 ? 'pagada' : 'parcial';

  if (!inv.payments) inv.payments = [];
  inv.payments.push({
    id: 'pay-sup-' + Date.now(),
    date: date || new Date().toISOString(),
    amount,
    method,
    note: note || 'Abono a proveedor'
  });

  // Registrar egreso en Caja si fue en efectivo
  appState.expenses.push({
    id: 'exp-' + Date.now(),
    date: date || new Date().toISOString(),
    category: 'proveedores',
    title: `Abono a Factura Proveedor ${inv.providerName} #${inv.invoiceNumber}`,
    amount,
    paymentMethod: method
  });

  saveState();
  closeSupplierPaymentModal();

  renderSupplierInvoicesTable();
  renderExpensesTable();
  updateQuickCajaBadge();

  showToast(`¡Abono de ${formatMoney(amount)} registrado a ${inv.providerName}! Nuevo saldo: ${formatMoney(inv.balanceDue)}`, 'success');
}

window.sendSupplierDebtWhatsAppReminder = function(invoiceId) {
  const inv = (appState.supplierInvoices || []).find(s => s.id === invoiceId);
  if (!inv) return;

  const adminPhone = (appState.config && (appState.config.adminPhone || appState.config.phone)) || '+573166390429';
  const cleanPhone = adminPhone.replace(/\D/g, '');

  const msg = [
    '⚠️ *RECORDATORIO DE PAGO A PROVEEDOR — VISOS KERATIN*',
    '----------------------------------------',
    `🏢 *Proveedor:* ${inv.providerName}`,
    `📄 *Factura:* #${inv.invoiceNumber}`,
    `💰 *Saldo Pendiente:* ${formatMoney(inv.balanceDue)}`,
    `📅 *Fecha Límite:* ${inv.dueDate}`,
    `💳 *Total Factura:* ${formatMoney(inv.totalAmount)} (Abonado: ${formatMoney(inv.paidAmount)})`,
    '----------------------------------------',
    'Por favor programar el pago para mantener el crédito al día.'
  ].join('\n');

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
};

function sendAllDebtsSummaryWhatsApp() {
  const pending = (appState.supplierInvoices || []).filter(i => i.balanceDue > 0);
  if (pending.length === 0) {
    showToast('¡Felicitaciones! No tienes facturas pendientes con ningún proveedor.', 'success');
    return;
  }

  const adminPhone = (appState.config && (appState.config.adminPhone || appState.config.phone)) || '+573166390429';
  const cleanPhone = adminPhone.replace(/\D/g, '');
  const totalDebt = pending.reduce((acc, i) => acc + i.balanceDue, 0);

  const lines = [
    '📊 *RESUMEN DE CUENTAS POR PAGAR — VISOS KERATIN*',
    '----------------------------------------',
    `*TOTAL DEUDA A PROVEEDORES:* ${formatMoney(totalDebt)}`,
    `*Facturas Pendientes:* ${pending.length}`,
    '----------------------------------------'
  ];

  pending.forEach((p, idx) => {
    lines.push(`${idx + 1}. *${p.providerName}* (Fact. #${p.invoiceNumber})`);
    lines.push(`   Saldo: ${formatMoney(p.balanceDue)} | Vence: ${p.dueDate}`);
  });

  lines.push('----------------------------------------');
  lines.push('Generado desde el Sistema Contable de Visos Keratin.');

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
  window.open(waUrl, '_blank');
}

window.openSupplierInvoiceDetailModal = function(invoiceId) {
  const inv = (appState.supplierInvoices || []).find(s => s.id === invoiceId);
  if (!inv) return;

  const modal = document.getElementById('supplierInvoiceDetailModal');
  const title = document.getElementById('supDetailTitle');
  const body = document.getElementById('supDetailBody');

  if (title) title.textContent = `Factura #${inv.invoiceNumber} — ${inv.providerName}`;
  if (body) {
    body.innerHTML = `
      <div style="background:#F8FAFC; padding:12px; border-radius:8px; margin-bottom:12px; font-size:12.5px;">
        <div><strong>Proveedor:</strong> ${escapeHtml(inv.providerName)}</div>
        <div><strong>Emisión:</strong> ${inv.issueDate || '—'} | <strong>Fecha Límite:</strong> ${inv.dueDate || '—'}</div>
        <div><strong>Total Factura:</strong> ${formatMoney(inv.totalAmount)} | <strong>Abonado:</strong> ${formatMoney(inv.paidAmount)}</div>
        <div><strong>Saldo Pendiente:</strong> <span style="color:#DC2626; font-weight:800;">${formatMoney(inv.balanceDue)}</span></div>
      </div>

      <h4 style="font-size:13px; font-weight:700; margin-bottom:6px;">Productos Ingresados al Inventario:</h4>
      <div class="table-responsive-container" style="max-height:200px; overflow-y:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="text-right">Cant.</th>
              <th class="text-right">Costo Neto</th>
              <th class="text-right">Precio Venta</th>
              <th class="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${(inv.items || []).map(item => `
              <tr>
                <td>${escapeHtml(item.name)}</td>
                <td class="text-right">${item.qty}</td>
                <td class="text-right">${formatMoney(item.netCost)}</td>
                <td class="text-right" style="color:#B45309; font-weight:700;">${formatMoney(item.suggestedPrice)}</td>
                <td class="text-right font-bold">${formatMoney(item.netCost * item.qty)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <h4 style="font-size:13px; font-weight:700; margin:12px 0 6px;">Historial de Pagos / Abonos Realizados:</h4>
      ${(inv.payments && inv.payments.length > 0) ? `
        <ul style="font-size:12px; padding-left:18px;">
          ${inv.payments.map(p => `
            <li>
              <strong>${formatMoney(p.amount)}</strong> (${p.method}) el ${new Date(p.date).toLocaleDateString('es-ES')} — <em>${escapeHtml(p.note || '')}</em>
            </li>
          `).join('')}
        </ul>
      ` : '<p style="font-size:12px; color:var(--text-muted);">No se han realizado abonos a esta factura aún.</p>'}
    `;
  }

  modal.classList.add('active');
  initLucide();
};

// ==========================================================================
// 22. MÓDULO DE CARTERA DE CLIENTAS MOROSAS, ABONOS & PAZ Y SALVO
// ==========================================================================

function initDebtorsModule() {
  // Pestañas de clientas
  const clientSubtabBtns = document.querySelectorAll('.clientas-subtabs .client-subtab-btn');
  const clientPanes = document.querySelectorAll('.tab-pane#tab-clientas .client-subpane');

  clientSubtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      clientSubtabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.getAttribute('data-subtab');
      clientPanes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.add('active');
          pane.style.display = 'block';
        } else {
          pane.classList.remove('active');
          pane.style.display = 'none';
        }
      });

      if (targetId === 'subtab-cartera-morosas') {
        renderDebtorsTable();
      }
    });
  });

  // Filtros de cartera
  const debtorSearch = document.getElementById('debtorSearchInput');
  const debtorStatus = document.getElementById('debtorStatusFilter');
  if (debtorSearch) debtorSearch.addEventListener('input', renderDebtorsTable);
  if (debtorStatus) debtorStatus.addEventListener('change', renderDebtorsTable);

  // Modal de abono de clienta
  const btnCloseModal = document.getElementById('btnCloseClientPaymentModal');
  const btnCancelModal = document.getElementById('btnCancelClientPaymentModal');
  const form = document.getElementById('clientPaymentForm');
  const btnPayFull = document.getElementById('btnPayClientFull');

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeClientPaymentModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeClientPaymentModal);
  if (form) form.addEventListener('submit', saveClientPayment);

  if (btnPayFull) {
    btnPayFull.addEventListener('click', () => {
      const invId = document.getElementById('payClientInvoiceId').value;
      const inv = appState.invoices.find(i => i.id === invId);
      if (inv) {
        document.getElementById('payClientAmount').value = inv.balanceDue;
      }
    });
  }
}

function renderDebtorsTable() {
  const tbody = document.getElementById('debtorsTableBody');
  if (!tbody) return;

  const invoices = appState.invoices || [];

  // Calcular métricas de cartera
  let totalDebt = 0;
  let activeDebtorsSet = new Set();
  let pazYSalvoCount = 0;

  invoices.forEach(inv => {
    const bal = Number(inv.balanceDue) || 0;
    if (bal > 0) {
      totalDebt += bal;
      activeDebtorsSet.add(inv.clientName);
    } else if (inv.paymentTerm === 'credito' || (inv.payments && inv.payments.length > 1)) {
      pazYSalvoCount++;
    }
  });

  const debtEl = document.getElementById('metricTotalClientDebt');
  const countEl = document.getElementById('metricDebtorClientsCount');
  const pazEl = document.getElementById('metricPazYSalvoCount');
  const badgeCounter = document.getElementById('badgeDebtorClientsCount');

  if (debtEl) debtEl.textContent = formatMoney(totalDebt);
  if (countEl) countEl.textContent = activeDebtorsSet.size;
  if (pazEl) pazEl.textContent = pazYSalvoCount;
  if (badgeCounter) {
    badgeCounter.textContent = activeDebtorsSet.size;
    badgeCounter.style.display = activeDebtorsSet.size > 0 ? 'inline-block' : 'none';
  }

  const searchQuery = (document.getElementById('debtorSearchInput')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('debtorStatusFilter')?.value || 'pending';

  const filtered = invoices.filter(inv => {
    const isCredit = inv.paymentTerm === 'credito' || (Number(inv.balanceDue) > 0);
    if (!isCredit) return false;

    if (statusFilter === 'pending' && Number(inv.balanceDue) <= 0) return false;

    if (searchQuery) {
      const matchName = (inv.clientName || '').toLowerCase().includes(searchQuery);
      const matchPhone = (inv.clientPhone || '').toLowerCase().includes(searchQuery);
      const matchNum = (inv.number || '').toLowerCase().includes(searchQuery);
      if (!matchName && !matchPhone && !matchNum) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
          ${statusFilter === 'pending' ? '🎉 ¡Excelente! No hay clientas con saldo pendiente en este momento.' : 'No hay historial de créditos con los filtros seleccionados.'}
        </td>
      </tr>
    `;
    return;
  }

  const now = new Date();

  tbody.innerHTML = filtered.map(inv => {
    const d = new Date(inv.date);
    const dateStr = d.toLocaleDateString('es-ES');
    const isOverdue = inv.dueDate && new Date(inv.dueDate) < now && inv.balanceDue > 0;

    return `
      <tr>
        <td><strong>${escapeHtml(inv.clientName)}</strong></td>
        <td>
          <a href="https://wa.me/${(inv.clientPhone || '').replace(/\D/g, '')}" target="_blank" style="color:#059669; font-weight:600; text-decoration:none;">
            ${escapeHtml(inv.clientPhone || 'Sin teléfono')}
          </a>
        </td>
        <td><strong>${inv.number}</strong></td>
        <td>${dateStr}</td>
        <td>
          ${inv.dueDate ? `
            <strong style="color:${isOverdue ? '#DC2626' : 'var(--navy)'};">
              ${inv.dueDate} ${isOverdue ? '⚠️ (Mora)' : ''}
            </strong>
          ` : '—'}
        </td>
        <td class="text-right">${formatMoney(inv.total)}</td>
        <td class="text-right" style="color:#059669; font-weight:700;">${formatMoney(inv.paidAmount || 0)}</td>
        <td class="text-right" style="color:${inv.balanceDue > 0 ? '#DC2626' : '#059669'}; font-weight:800; font-size:14px;">
          ${formatMoney(inv.balanceDue)}
        </td>
        <td class="text-center">
          ${inv.balanceDue <= 0
            ? '<span class="badge-stock badge-stock-ok">Paz y Salvo</span>'
            : (isOverdue
                ? '<span class="badge-stock badge-stock-low" style="background:#FEE2E2; color:#DC2626;">Morosa</span>'
                : '<span class="badge-stock badge-stock-low" style="background:#FEF3C7; color:#B45309;">Con Saldo</span>')
          }
        </td>
        <td class="text-center">
          <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap;">
            ${inv.balanceDue > 0 ? `
              <button class="btn-tbl-action" onclick="openClientPaymentModal('${inv.id}')" style="color:#059669; font-weight:700; border-color:#059669;" title="Registrar Abono">
                💵 Abonar
              </button>
              <button class="btn-tbl-action" onclick="sendClientDebtWhatsAppReminder('${inv.id}')" style="color:#0284C7; font-weight:700; border-color:#0284C7;" title="Recordatorio por WhatsApp">
                📲 Cobrar
              </button>
            ` : ''}
            <button class="btn-tbl-action" onclick="viewExistingInvoice('${inv.id}')" title="Ver Recibo">
              🧾 Recibo
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openClientPaymentModal = function(invoiceId) {
  const inv = appState.invoices.find(i => i.id === invoiceId);
  if (!inv) return;

  const modal = document.getElementById('clientPaymentModal');
  document.getElementById('payClientInvoiceId').value = inv.id;
  document.getElementById('payClientSummary').textContent = `${inv.clientName} — Factura #${inv.number} (${inv.clientPhone || 'Sin tel.'})`;
  document.getElementById('payClientTotalFactura').textContent = formatMoney(inv.total);
  document.getElementById('payClientCurrentBalance').textContent = formatMoney(inv.balanceDue);
  document.getElementById('payClientDate').value = getTodayIso();
  document.getElementById('payClientAmount').value = inv.balanceDue;
  document.getElementById('payClientNote').value = '';

  // Historial de pagos
  const historyList = document.getElementById('payClientHistoryList');
  if (historyList) {
    if (inv.payments && inv.payments.length > 0) {
      historyList.innerHTML = inv.payments.map((p, idx) => `
        <div style="display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px solid #F1F5F9;">
          <span>#${idx + 1} • ${new Date(p.date).toLocaleDateString('es-ES')} (${p.method})</span>
          <strong>${formatMoney(p.amount)}</strong>
        </div>
      `).join('');
    } else {
      historyList.innerHTML = '<span style="color:var(--text-muted);">Sin abonos previos registrados.</span>';
    }
  }

  modal.classList.add('active');
  initLucide();
};

function closeClientPaymentModal() {
  const modal = document.getElementById('clientPaymentModal');
  if (modal) modal.classList.remove('active');
}

function saveClientPayment(e) {
  e.preventDefault();
  const invoiceId = document.getElementById('payClientInvoiceId').value;
  const inv = appState.invoices.find(i => i.id === invoiceId);
  if (!inv) return;

  const amount = Number(document.getElementById('payClientAmount').value) || 0;
  const date = document.getElementById('payClientDate').value;
  const method = document.getElementById('payClientMethod').value;
  const note = document.getElementById('payClientNote').value.trim();

  if (amount <= 0 || amount > inv.balanceDue) {
    showToast('El monto debe ser mayor a 0 y no superar el saldo pendiente', 'warning');
    return;
  }

  inv.paidAmount = (inv.paidAmount || 0) + amount;
  inv.balanceDue = Math.max(0, inv.total - inv.paidAmount);
  inv.status = inv.balanceDue === 0 ? 'pagada' : 'pendiente';

  if (!inv.payments) inv.payments = [];
  inv.payments.push({
    id: 'pay-' + Date.now(),
    date: date || new Date().toISOString(),
    amount,
    method,
    note: note || 'Abono recibido en recepción'
  });

  saveState();
  closeClientPaymentModal();

  renderDebtorsTable();
  renderInvoicesTable();
  updateQuickCajaBadge();

  if (inv.balanceDue === 0) {
    showToast(`¡Paz y Salvo! ${inv.clientName} ha cancelado la totalidad de la factura #${inv.number}.`, 'success');
  } else {
    showToast(`¡Abono de ${formatMoney(amount)} recibido de ${inv.clientName}! Saldo restante: ${formatMoney(inv.balanceDue)}`, 'success');
  }

  // Ofrecer comprobante por WhatsApp
  sendClientPaymentReceiptWhatsApp(inv, amount);
}

window.sendClientDebtWhatsAppReminder = function(invoiceId) {
  const inv = appState.invoices.find(i => i.id === invoiceId);
  if (!inv) return;

  const cleanPhone = (inv.clientPhone || '').replace(/\D/g, '');
  const salonPhone = appState.config.phone || '+57 3166390429';

  const msg = [
    `¡Hola *${inv.clientName}*! ✨ Te saludamos de *${appState.config.salonName || 'VISOS KERATIN'}*.`,
    '',
    `Te recordamos cordialmente que tienes un saldo pendiente de *${formatMoney(inv.balanceDue)}* correspondiente a tu visita (Factura *#${inv.number}*).`,
    inv.dueDate ? `📅 *Fecha límite / compromiso:* ${inv.dueDate}` : '',
    '',
    `Puedes realizar tu transferencia por Nequi o Daviplata al número: *${salonPhone}*.`,
    '¡Muchísimas gracias por confiar en nosotras para cuidar tu cabello! 💕'
  ].filter(Boolean).join('\n');

  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  window.open(waUrl, '_blank');
};

function sendClientPaymentReceiptWhatsApp(inv, abonoAmount) {
  const cleanPhone = (inv.clientPhone || '').replace(/\D/g, '');
  const isPazYSalvo = inv.balanceDue === 0;

  const msg = [
    `🧾 *RECIBO DE ABONO — ${appState.config.salonName || 'VISOS KERATIN'}*`,
    '----------------------------------------',
    `Clienta: *${inv.clientName}*`,
    `Factura: *#${inv.number}*`,
    `Abono Recibido: *${formatMoney(abonoAmount)}*`,
    `Total Factura: ${formatMoney(inv.total)}`,
    `Total Abonado: ${formatMoney(inv.paidAmount)}`,
    '----------------------------------------',
    isPazYSalvo
      ? '🎉 *ESTADO: PAZ Y SALVO (TOTALMENTE PAGADO)*'
      : `⚠️ *SALDO PENDIENTE:* *${formatMoney(inv.balanceDue)}*`,
    '----------------------------------------',
    '¡Gracias por tu pago y preferencia!'
  ].join('\n');

  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  // Pequeño retardo para no interferir con el toast
  setTimeout(() => {
    if (confirm(`¿Deseas enviar el comprobante de este abono de ${formatMoney(abonoAmount)} al WhatsApp de ${inv.clientName}?`)) {
      window.open(waUrl, '_blank');
    }
  }, 400);
}
