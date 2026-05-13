/**
 * Native <dialog> dismiss: Escape and backdrop click close any open modal.
 */
function bindDismissibleDialog(dialog: HTMLDialogElement): void {
  if (dialog.dataset.dismissBound === 'true') return
  dialog.dataset.dismissBound = 'true'

  dialog.addEventListener('click', (event) => {
    if (!dialog.open) return
    if (event.target === dialog) dialog.close()
  })

  dialog.addEventListener('cancel', () => {
    if (dialog.open) dialog.close()
  })
}

function bindAllDialogs(): void {
  document.querySelectorAll('dialog').forEach((node) => {
    if (node instanceof HTMLDialogElement) bindDismissibleDialog(node)
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindAllDialogs)
} else {
  bindAllDialogs()
}
