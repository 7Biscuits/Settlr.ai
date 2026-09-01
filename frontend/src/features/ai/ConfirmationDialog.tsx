"use client";

interface Props {
  content: string;
  action: { tool: string; arguments: unknown };
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation gate for sensitive AI-proposed actions. The action is only
 * executed after the user explicitly confirms here.
 */
export function ConfirmationDialog({
  content,
  action,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded border border-gray-700 bg-gray-950 p-6">
        <h3 className="mb-2 text-lg font-semibold">Confirm action</h3>
        <p className="mb-3 text-sm text-gray-300">{content}</p>
        <div className="mb-4 rounded bg-gray-900 p-3 text-xs">
          <p className="mb-1 font-mono">{action.tool}</p>
          <pre className="overflow-auto text-gray-400">
            {JSON.stringify(action.arguments, null, 2)}
          </pre>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded border border-gray-600 px-4 py-2 hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
