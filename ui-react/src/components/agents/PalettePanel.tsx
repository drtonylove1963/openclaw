/**
 * PalettePanel - Left sidebar palette with draggable workflow items
 *
 * Displays a searchable, categorized list of items that can be dragged
 * onto the workflow canvas. Supports drag-and-drop via HTML5 API.
 */

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { COLORS } from '../../styles/colors';

export interface PaletteItem {
  id: string;
  type: string;  // node type in ReactFlow
  label: string;
  icon?: React.ReactNode;
  category?: string;
  color?: string;
  data: Record<string, any>;  // data to pass to the node
}

export interface PalettePanelProps {
  items: PaletteItem[];
  title?: string;
  onDragStart?: (item: PaletteItem) => void;
  onItemClick?: (item: PaletteItem) => void;
}

export function PalettePanel({
  items,
  title = 'Components',
  onDragStart,
  onItemClick,
}: PalettePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Group items by category
  const categorizedItems = useMemo(() => {
    const filtered = items.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped = new Map<string, PaletteItem[]>();
    filtered.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category).push(item);
    });

    return Array.from(grouped.entries()).toSorted((a, b) => a[0].localeCompare(b[0]));
  }, [items, searchQuery]);

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleDragStart = (event: React.DragEvent, item: PaletteItem) => {
    // Store item data in drag event
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(item);
  };

  return (
    <div
      style={{
        width: '280px',
        height: '100%',
        backgroundColor: COLORS.bgPanel,
        borderRight: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: 600,
            color: COLORS.text,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </h3>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '14px',
              height: '14px',
              color: COLORS.textMuted,
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 8px 8px 32px',
              fontSize: '13px',
              backgroundColor: COLORS.bgHover,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              color: COLORS.text,
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.info;
              e.target.style.backgroundColor = COLORS.bgActive;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = COLORS.border;
              e.target.style.backgroundColor = COLORS.bgHover;
            }}
          />
        </div>
      </div>

      {/* Items List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {categorizedItems.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: COLORS.textMuted,
              fontSize: '13px',
            }}
          >
            No items found
          </div>
        ) : (
          categorizedItems.map(([category, categoryItems]) => {
            const isCollapsed = collapsedCategories.has(category);

            return (
              <div key={category} style={{ marginBottom: '8px' }}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: COLORS.textMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {isCollapsed ? (
                    <ChevronRight style={{ width: '14px', height: '14px' }} />
                  ) : (
                    <ChevronDown style={{ width: '14px', height: '14px' }} />
                  )}
                  {category}
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      color: COLORS.textDim,
                    }}
                  >
                    {categoryItems.length}
                  </span>
                </button>

                {/* Category Items */}
                {!isCollapsed && (
                  <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onClick={() => onItemClick?.(item)}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: COLORS.bgHover,
                          border: `1px solid ${COLORS.border}`,
                          borderLeft: `3px solid ${item.color || COLORS.info}`,
                          borderRadius: '6px',
                          cursor: 'grab',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.bgActive;
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.boxShadow = `0 2px 8px ${item.color || COLORS.info}30`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.bgHover;
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        onDragStartCapture={(e) => {
                          e.currentTarget.style.cursor = 'grabbing';
                          e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragEndCapture={(e) => {
                          e.currentTarget.style.cursor = 'grab';
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        {item.icon && (
                          <div
                            style={{
                              flexShrink: 0,
                              fontSize: '18px',
                              lineHeight: 1,
                            }}
                          >
                            {item.icon}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: COLORS.text,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
