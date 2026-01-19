import React from 'react';
import { render } from '@testing-library/react-native';
import AggregateRatingDisplay from '../AggregateRatingDisplay';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Wrapper component to provide theme context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('AggregateRatingDisplay', () => {
  it('renders correctly with rating and review count', () => {
    const { getByText } = render(
      <TestWrapper>
        <AggregateRatingDisplay rating={4.5} reviewCount={127} />
      </TestWrapper>
    );

    expect(getByText('4.5')).toBeTruthy();
    expect(getByText('(127 reviews)')).toBeTruthy();
  });

  it('renders "No reviews yet" when review count is 0', () => {
    const { getByText } = render(
      <TestWrapper>
        <AggregateRatingDisplay rating={0} reviewCount={0} />
      </TestWrapper>
    );

    expect(getByText('No reviews yet')).toBeTruthy();
  });

  it('renders singular "review" for count of 1', () => {
    const { getByText } = render(
      <TestWrapper>
        <AggregateRatingDisplay rating={4.0} reviewCount={1} />
      </TestWrapper>
    );

    expect(getByText('(1 review)')).toBeTruthy();
  });

  it('hides review count when showCount is false', () => {
    const { queryByText, getByText } = render(
      <TestWrapper>
        <AggregateRatingDisplay rating={4.2} reviewCount={50} showCount={false} />
      </TestWrapper>
    );

    expect(getByText('4.2')).toBeTruthy();
    expect(queryByText('(50 reviews)')).toBeNull();
  });

  it('formats rating to one decimal place', () => {
    const { getByText } = render(
      <TestWrapper>
        <AggregateRatingDisplay rating={3.8} reviewCount={45} />
      </TestWrapper>
    );

    expect(getByText('3.8')).toBeTruthy();
  });

  it('handles perfect 5.0 rating', () => {
    const { getByText } = render(
      <TestWrapper>
        <AggregateRatingDisplay rating={5.0} reviewCount={100} />
      </TestWrapper>
    );

    expect(getByText('5.0')).toBeTruthy();
    expect(getByText('(100 reviews)')).toBeTruthy();
  });

  it('renders with small size', () => {
    const { getByText } = render(
      <TestWrapper>
        <AggregateRatingDisplay rating={4.3} reviewCount={78} size="small" />
      </TestWrapper>
    );

    expect(getByText('4.3')).toBeTruthy();
  });

  it('renders with large size', () => {
    const { getByText } = render(
      <TestWrapper>
        <AggregateRatingDisplay rating={4.7} reviewCount={200} size="large" />
      </TestWrapper>
    );

    expect(getByText('4.7')).toBeTruthy();
  });
});
