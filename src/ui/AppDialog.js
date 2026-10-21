/** Diálogos do jogo. A fila evita janelas sobrepostas e confirmações perdidas. */
export class AppDialog {
  static queue = Promise.resolve();

  static open(options) {
    const result = this.queue.then(() => this.show(options));
    this.queue = result.catch(() => {});
    return result;
  }

  static show({ title, message, icon = '✦', confirmText = 'Entendi', cancelText = null, danger = false, reward = null }) {
    return new Promise(resolve => {
      const previousFocus = document.activeElement;
      const dialog = document.createElement('dialog');
      dialog.className = `app-dialog${danger ? ' app-dialog-danger' : ''}`;
      dialog.setAttribute('aria-labelledby', 'app-dialog-title');
      dialog.setAttribute('aria-describedby', 'app-dialog-message');
      const card = document.createElement('div');
      card.className = 'app-dialog-card';
      const emblem = document.createElement('div');
      emblem.className = 'app-dialog-emblem';
      emblem.textContent = icon;
      emblem.setAttribute('aria-hidden', 'true');
      const eyebrow = document.createElement('span');
      eyebrow.className = 'app-dialog-eyebrow';
      eyebrow.textContent = danger ? 'CUIDADO COM SEU IMPÉRIO' : 'PAÇOCA CLICKER';
      const heading = document.createElement('h2');
      heading.id = 'app-dialog-title';
      heading.textContent = title;
      const description = document.createElement('p');
      description.id = 'app-dialog-message';
      description.className = 'app-dialog-message';
      description.textContent = message;
      card.append(emblem, eyebrow, heading, description);
      if (reward) {
        const box = document.createElement('div');
        box.className = 'app-dialog-reward';
        const label = document.createElement('span');
        label.textContent = reward.label;
        const value = document.createElement('strong');
        value.textContent = reward.value;
        box.append(label, value);
        card.appendChild(box);
      }
      const actions = document.createElement('div');
      actions.className = 'app-dialog-actions';
      let settled = false;
      const finish = accepted => {
        if (settled) return;
        settled = true;
        dialog.close();
        dialog.remove();
        if (previousFocus?.isConnected) previousFocus.focus();
        resolve(accepted);
      };
      const confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'app-dialog-button app-dialog-primary';
      confirm.textContent = confirmText;
      confirm.addEventListener('click', () => finish(true));
      if (cancelText) {
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'app-dialog-button app-dialog-secondary';
        cancel.textContent = cancelText;
        cancel.autofocus = true;
        cancel.addEventListener('click', () => finish(false));
        // Primeiro botão é a opção segura na navegação por teclado.
        actions.append(cancel, confirm);
      } else {
        confirm.autofocus = true;
        actions.appendChild(confirm);
      }
      card.appendChild(actions);
      dialog.appendChild(card);
      dialog.addEventListener('cancel', event => {
        event.preventDefault();
        finish(false);
      });
      dialog.addEventListener('close', () => finish(false));
      document.body.appendChild(dialog);
      dialog.showModal();
    });
  }
}
