export function Turntable({ playing }: { playing: boolean }) {
  return (
    <div className={`deck ${playing ? 'on' : ''}`} aria-hidden="true">
      <div className={`vinyl ${playing ? 'spinning' : ''}`}>
        <div className="vinyl-label">?</div>
      </div>
      <div className="arm" />
    </div>
  )
}
