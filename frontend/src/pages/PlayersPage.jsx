import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import PlayerCard from '../components/players/PlayerCard';
import './PlayersPage.css';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'LWF', 'RWF', 'SS', 'CF'];
const PAGE_SIZE = 24;

export default function PlayersPage() {
  const [players, setPlayers]       = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // Filters
  const [search, setSearch]         = useState('');
  const [position, setPosition]     = useState('');
  const [page, setPage]             = useState(1);

  // Debounce search
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  };

  const handlePositionChange = (e) => { setPosition(e.target.value); setPage(1); };
  const handleClearFilters   = () => { setSearch(''); setDebouncedSearch(''); setPosition(''); setPage(1); };

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: PAGE_SIZE,
        page,
      };
      if (debouncedSearch) params.name     = debouncedSearch;
      if (position)        params.position = position;

      const res = await api.get('/players', { params });
      // Backend returns { success, data: [...], meta: { total, ... } }
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPlayers(res.data.data);
        setTotal(res.data.meta?.total || res.data.data.length);
      } else if (Array.isArray(res.data)) {
        setPlayers(res.data);
        setTotal(res.data.length);
      } else {
        setPlayers(res.data.players || []);
        setTotal(res.data.total    || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, position, page]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = debouncedSearch || position;

  return (
    <div className="players-page">
      {/* ── Header ── */}
      <div className="players-page__hero">
        <div className="players-page__hero-content">
          <div className="players-page__hero-icon">⚽</div>
          <div>
            <h1 className="players-page__title">ทำเนียบนักเตะ</h1>
            <p className="players-page__subtitle">
              eFootball Player Database · {total.toLocaleString()} การ์ดนักเตะ
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="players-page__filters">
        {/* Search */}
        <div className="players-filter__search-wrap">
          <span className="players-filter__search-icon">🔍</span>
          <input
            id="players-search"
            type="search"
            className="players-filter__search"
            placeholder="ค้นหาชื่อนักเตะ... เช่น Messi, Ronaldo"
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Position filter */}
        <select
          id="players-position-filter"
          className="players-filter__select"
          value={position}
          onChange={handlePositionChange}
        >
          <option value="">ทุกตำแหน่ง</option>
          {POSITIONS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            id="players-clear-filters"
            className="players-filter__clear"
            onClick={handleClearFilters}
          >
            ✕ ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="players-page__body">
        {error && (
          <div className="players-page__error">
            <span>⚠️</span>
            <span>เกิดข้อผิดพลาด: {error}</span>
          </div>
        )}

        {loading ? (
          <div className="players-page__skeleton-grid">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="players-skeleton-card">
                <div className="players-skeleton-card__img skeleton-pulse" />
                <div className="players-skeleton-card__footer">
                  <div className="skeleton-line skeleton-pulse" style={{ width: '70%' }} />
                  <div className="skeleton-line skeleton-pulse" style={{ width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="players-page__empty">
            <div className="players-page__empty-icon">🔍</div>
            <p>ไม่พบนักเตะที่ตรงกับเงื่อนไข</p>
            {hasFilters && (
              <button className="players-filter__clear" onClick={handleClearFilters}>
                ล้างตัวกรองแล้วลองใหม่
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="players-page__count">
              แสดง {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} จากทั้งหมด <strong>{total.toLocaleString()}</strong> การ์ด
            </p>

            <div className="players-page__grid">
              {players.map(player => (
                <PlayerCard
                  key={player.id}
                  player={player}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="players-pagination">
                <button
                  id="players-page-prev"
                  className="players-pagination__btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  ‹ ก่อนหน้า
                </button>

                <div className="players-pagination__pages">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, idx) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = idx + 1;
                    } else if (page <= 4) {
                      pageNum = idx + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + idx;
                    } else {
                      pageNum = page - 3 + idx;
                    }

                    return (
                      <button
                        key={pageNum}
                        className={`players-pagination__page ${page === pageNum ? 'active' : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  id="players-page-next"
                  className="players-pagination__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  ถัดไป ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
