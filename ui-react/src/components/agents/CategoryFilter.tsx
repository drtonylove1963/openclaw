import React from 'react';
import type { Category } from '../../types/agent';
import { COLORS } from '../../styles/colors';

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selected,
  onSelect,
}) => {
  const styles = {
    container: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '10px',
      marginBottom: '32px',
    },
    chip: {
      padding: '10px 18px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: '1px solid',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      userSelect: 'none' as const,
    },
    chipInactive: {
      backgroundColor: COLORS.card,
      color: COLORS.textMuted,
      borderColor: COLORS.border,
    },
    chipActive: {
      backgroundColor: `${COLORS.accent}20`,
      color: COLORS.accent,
      borderColor: COLORS.accent,
      fontWeight: 600,
    },
    count: {
      fontSize: '12px',
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: '6px',
      backgroundColor: 'currentColor',
      color: COLORS.card,
      opacity: 0.2,
    },
    countActive: {
      opacity: 1,
      backgroundColor: COLORS.accent,
      color: COLORS.text,
    },
  };

  const handleChipClick = (categoryName: string | null) => {
    // Toggle off if already selected
    if (selected === categoryName) {
      onSelect(null);
    } else {
      onSelect(categoryName);
    }
  };

  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>, isActive: boolean) => {
    if (!isActive) {
      const element = e.currentTarget as HTMLDivElement;
      element.style.backgroundColor = COLORS.bgAlt;
      element.style.borderColor = COLORS.accent;
      element.style.color = COLORS.text;
    }
  };

  const handleMouseOut = (e: React.MouseEvent<HTMLDivElement>, isActive: boolean) => {
    if (!isActive) {
      const element = e.currentTarget as HTMLDivElement;
      element.style.backgroundColor = COLORS.card;
      element.style.borderColor = COLORS.border;
      element.style.color = COLORS.textMuted;
    }
  };

  // Calculate total count for "All" chip
  const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0);
  const isAllSelected = selected === null;

  return (
    <div style={styles.container}>
      {/* All chip */}
      <div
        style={{
          ...styles.chip,
          ...(isAllSelected ? styles.chipActive : styles.chipInactive),
        }}
        onClick={() => handleChipClick(null)}
        onMouseOver={(e) => handleMouseOver(e, isAllSelected)}
        onMouseOut={(e) => handleMouseOut(e, isAllSelected)}
      >
        <span>All</span>
        <span
          style={{
            ...styles.count,
            ...(isAllSelected ? styles.countActive : {}),
          }}
        >
          {totalCount}
        </span>
      </div>

      {/* Category chips */}
      {categories.map((category) => {
        const isActive = selected === category.name;
        return (
          <div
            key={category.id}
            style={{
              ...styles.chip,
              ...(isActive ? styles.chipActive : styles.chipInactive),
            }}
            onClick={() => handleChipClick(category.name)}
            onMouseOver={(e) => handleMouseOver(e, isActive)}
            onMouseOut={(e) => handleMouseOut(e, isActive)}
          >
            <span>{category.name}</span>
            <span
              style={{
                ...styles.count,
                ...(isActive ? styles.countActive : {}),
              }}
            >
              {category.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
