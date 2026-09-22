import { useState } from 'react';
import './PlayerCard.css';

/**
 * PlayerCard — eFootball-style player card (Clean design without inaccurate tier labels)
 * @param {object} player - player data from API
 * @param {function} onClick - optional click handler
 */
export default function PlayerCard({ player, onClick }) {
  const [imgError, setImgError] = useState(false);

  const handleClick = () => onClick && onClick(player);

  return (
    <div
      className="player-card"
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && handleClick() : undefined}
    >
      {/* Card Image Area */}
      <div className="player-card__image-wrap">
        {player.image_url && !imgError ? (
          <img
            src={player.image_url}
            alt={player.player_name}
            className="player-card__img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="player-card__placeholder">
            <span className="player-card__placeholder-icon">⚽</span>
            <span className="player-card__placeholder-name">{player.player_name?.split(' ').pop()}</span>
          </div>
        )}

        {/* OVR + Position overlay (top-left) */}
        <div className="player-card__ovr-badge">
          <span className="player-card__ovr">{player.overall_rating}</span>
          <span className="player-card__pos">{player.position_code}</span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="player-card__footer">
        <p className="player-card__name" title={player.player_name}>
          {player.player_name}
        </p>
        {player.club && (
          <p className="player-card__club" title={player.club}>
            {player.club}
          </p>
        )}
      </div>
    </div>
  );
}
