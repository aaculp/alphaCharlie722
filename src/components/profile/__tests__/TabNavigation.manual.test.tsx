/**
 * Manual verification test for TabNavigation component
 * This test verifies the basic rendering and functionality
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TabNavigation } from '../TabNavigation';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Wrapper component to provide theme context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('TabNavigation - Manual Verification', () => {
  it('should render both tabs', () => {
    const mockOnTabChange = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <TabNavigation activeTab="main" onTabChange={mockOnTabChange} />
      </TestWrapper>
    );

    expect(getByText('Main Info')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('should show Main Info as active by default', () => {
    const mockOnTabChange = jest.fn();
    const { getByTestId } = render(
      <TestWrapper>
        <TabNavigation activeTab="main" onTabChange={mockOnTabChange} />
      </TestWrapper>
    );

    expect(getByTestId('main-info-indicator')).toBeTruthy();
  });

  it('should call onTabChange when Settings tab is pressed', () => {
    const mockOnTabChange = jest.fn();
    const { getByTestId } = render(
      <TestWrapper>
        <TabNavigation activeTab="main" onTabChange={mockOnTabChange} />
      </TestWrapper>
    );

    fireEvent.press(getByTestId('settings-tab'));
    expect(mockOnTabChange).toHaveBeenCalledWith('settings');
  });

  it('should show Settings as active when activeTab is settings', () => {
    const mockOnTabChange = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TestWrapper>
        <TabNavigation activeTab="settings" onTabChange={mockOnTabChange} />
      </TestWrapper>
    );

    expect(getByTestId('settings-indicator')).toBeTruthy();
    expect(queryByTestId('main-info-indicator')).toBeNull();
  });

  it('should not call onTabChange when pressing already active tab', () => {
    const mockOnTabChange = jest.fn();
    const { getByTestId } = render(
      <TestWrapper>
        <TabNavigation activeTab="main" onTabChange={mockOnTabChange} />
      </TestWrapper>
    );

    fireEvent.press(getByTestId('main-info-tab'));
    expect(mockOnTabChange).not.toHaveBeenCalled();
  });
});
