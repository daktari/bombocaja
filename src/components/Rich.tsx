/** Renders a string with `backticks` as inline code. */
export default function Rich({ text }: { text: string }) {
  const parts = text.split(/`([^`]*)`/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className="text-acid bg-white/5 px-1">
            {part}
          </code>
        ) : (
          part
        )
      )}
    </>
  );
}
