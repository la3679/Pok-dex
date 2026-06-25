import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterPanel } from './FilterPanel';

describe('FilterPanel', () => {
  it('renders all filter controls', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();
    const initialFilters = { primaryType: '', generation: '', legendary: '', sortOption: 'No.' };

    render(<FilterPanel filters={initialFilters} onChange={mockOnChange} onReset={mockOnReset} />);

    expect(screen.getByText('Refine results')).toBeDefined();
    expect(screen.getByLabelText('Primary type')).toBeDefined();
    expect(screen.getByLabelText('Secondary type')).toBeDefined();
    expect(screen.getByLabelText('Generation')).toBeDefined();
    expect(screen.getByLabelText('Sort by')).toBeDefined();
    expect(screen.getByLabelText('Min Height (m)')).toBeDefined();
    expect(screen.getByLabelText('Max Height (m)')).toBeDefined();
    expect(screen.getByLabelText('Min Weight (kg)')).toBeDefined();
    expect(screen.getByLabelText('Max Weight (kg)')).toBeDefined();
    expect(screen.getByLabelText('Legendary only')).toBeDefined();
  });

  it('calls onChange when a filter is updated', async () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();
    const user = userEvent.setup();
    const initialFilters = { primaryType: '', generation: '', legendary: '', sortOption: 'No.' };

    render(<FilterPanel filters={initialFilters} onChange={mockOnChange} onReset={mockOnReset} />);

    const primaryTypeSelect = screen.getByLabelText('Primary type');
    await user.selectOptions(primaryTypeSelect, 'fire');

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
      primaryType: 'fire'
    }));

    const legendaryCheckbox = screen.getByLabelText('Legendary only');
    await user.click(legendaryCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
      legendary: 'true'
    }));
  });

  it('calls onReset when clear button is clicked', async () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();
    const user = userEvent.setup();

    render(<FilterPanel filters={{}} onChange={mockOnChange} onReset={mockOnReset} />);
    
    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(mockOnReset).toHaveBeenCalled();
  });
});
