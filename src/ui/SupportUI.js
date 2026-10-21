import { Capacitor } from '@capacitor/core';
import { ReportsClient, REPORT_CATEGORIES, validateReport } from '../systems/ReportsClient.js';
import { AppDialog } from './AppDialog.js';
import { trackDialog, waitForAppNavigation } from '../systems/AppNavigation.js';
import { GAME_TERMS, TERMS_VERSION } from './GameTerms.js';

export function initSupportUI({ user, demo = false, client = new ReportsClient() }) {
  const report = document.getElementById('report-dialog');
  const terms = document.getElementById('terms-dialog');
  if (!report || !terms) return;
  const form = document.getElementById('report-form');
  const type = document.getElementById('report-type');
  const category = document.getElementById('report-category');
  const message = document.getElementById('report-message');
  const error = document.getElementById('report-error');
  const submit = document.getElementById('report-submit');
  const cancel = document.getElementById('report-cancel');
  let sending = false;
  let previousFocus;
  let releaseReportLayer;
  const open = dialog => {
    previousFocus = document.activeElement;
    dialog.showModal();
    const release = trackDialog(dialog);
    if (dialog === report) releaseReportLayer = release;
  };
  for (const [value, label] of Object.entries(REPORT_CATEGORIES)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    category.appendChild(option);
  }
  const count = () => {
    document.getElementById('report-count').textContent = `${message.value.length}/500`;
    submit.disabled = sending || !message.value.trim() || message.value.length > 500;
  };
  message.addEventListener('input', count);
  document.getElementById('profile-report').addEventListener('click', () => { error.textContent = ''; count(); open(report); });
  cancel.addEventListener('click', () => { if (!sending) report.close(); });
  report.addEventListener('cancel', event => {
    if (sending) { event.preventDefault(); error.textContent = 'Envio em andamento. Aguarde a confirmação.'; }
  });
  for (const dialog of [report, terms]) {
    dialog.addEventListener('close', () => { if (previousFocus?.isConnected) previousFocus.focus(); });
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    error.textContent = '';
    try {
      const data = validateReport({ type: type.value, category: category.value, message: message.value });
      sending = true;
      submit.disabled = true;
      cancel.disabled = true;
      submit.textContent = 'Enviando…';
      await client.send(data, { user, platform: Capacitor.getPlatform(), demo });
      form.reset();
      releaseReportLayer?.();
      report.close();
      await waitForAppNavigation();
      await AppDialog.open({ icon: '✓', title: 'Enviado com sucesso!', message: 'Sua mensagem chegou à equipe. Obrigado por ajudar o Paçoca a crescer.', confirmText: 'Continuar jogando' });
    } catch (failure) { error.textContent = failure.message || 'Não foi possível enviar. Tente novamente mais tarde.'; }
    finally { sending = false; cancel.disabled = false; submit.textContent = 'Enviar mensagem'; count(); }
  });
  document.getElementById('terms-version').textContent = `Versão ${TERMS_VERSION} · Orientações do jogo`;
  const content = document.getElementById('terms-content');
  GAME_TERMS.forEach((section, index) => {
    const heading = document.createElement('h3');
    heading.textContent = `${index + 1}. ${section.title}`;
    const paragraph = document.createElement('p');
    paragraph.textContent = section.text;
    content.append(heading, paragraph);
  });
  document.getElementById('profile-terms').addEventListener('click', () => open(terms));
  document.getElementById('terms-close').addEventListener('click', () => terms.close());
}
