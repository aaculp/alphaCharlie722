import React from 'react';
import { render } from '@testing-library/react-native';
import { PerformanceSlider } from '../PerformanceSlider';
import { TodaysPerformance } from '../TodaysPerformance';
import { ThisWeeksAnalysis } from '../ThisWeeksAnalysis';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock analytics data
const mockAnalytics = {
  todayCheckIns: 42,
  todayNewFavorites: 18,
  todayRating: 4.5,
  weeklyCheckIns: 287,
  weeklyNewFavorites: 95,
  weeklyAvgRating: 4.3,
  currentActivity: {
    level: 'Busy',
    emoji: '🔥',
    capacity: 100,
  },
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('PerformanceSlider', () => {
  it('should render without crashing', () => {
    const { getByText } = renderWithTheme(
      <PerformanceSlider analytics={mockAnalytics} analyticsLoading={false} />
    );
    
    expect(getByText("Today's Performance")).toBeTruthy();
  });

  it('should show loading state', () => {
    const { getByText } = renderWithTheme(
      <PerformanceSlider analytics={mockAnalytics} analyticsLoading={true} />
    );
    
    expect(getByText(/Updating/)).toBeTruthy();
  });

  it('should render pagination dots', () => {
    const { getAllByRole } = renderWithTheme(
      <PerformanceSlider analytics={mockAnalytics} analyticsLoading={false} />
    );
    
    // Should have 2 pagination dots
    const dots = getAllByRole('button');
    expect(dots.length).toBeGreaterThanOrEqual(2);
  });

  it('should render section labels', () => {
    const { getByText } = renderWithTheme(
      <PerformanceSlider analytics={mockAnalytics} analyticsLoading={false} />
    );
    
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('This Week')).toBeTruthy();
  });
});

describe('TodaysPerformance', () => {
  it('should render all metrics', () => {
    const { getByText } = renderWithTheme(
      <TodaysPerformance analytics={mockAnalytics} analyticsLoading={false} />
    );
    
    expect(getByText('Check-ins')).toBeTruthy();
    expect(getByText('Newly Favorited')).toBeTruthy();
    expect(getByText('Current Activity')).toBeTruthy();
    expect(getByText('Rating Today')).toBeTruthy();
  });

  it('should display correct values', () => {
    const { getByText } = renderWithTheme(
      <TodaysPerformance analytics={mockAnalytics} analyticsLoading={false} />
    );
    
    expect(getByText('42')).toBeTruthy();
    expect(getByText('18')).toBeTruthy();
    expect(getByText('4.5')).toBeTruthy();
  });

  it('should show 0 when analytics is null', () => {
    const { getAllByText } = renderWithTheme(
      <TodaysPerformance analytics={null} analyticsLoading={false} />
    );
    
    const zeros = getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });
});

describe('ThisWeeksAnalysis', () => {
  it('should render all metrics', () => {
    const { getByText } = renderWithTheme(
      <ThisWeeksAnalysis analytics={mockAnalytics} analyticsLoading={false} />
    );
    
    expect(getByText('Check-ins')).toBeTruthy();
    expect(getByText('Newly Favorited')).toBeTruthy();
    expect(getByText('Avg. Activity')).toBeTruthy();
    expect(getByText('Avg. Rating')).toBeTruthy();
  });

  it('should display correct values', () => {
    const { getByText } = renderWithTheme(
      <ThisWeeksAnalysis analytics={mockAnalytics} analyticsLoading={false} />
    );
    
    expect(getByText('287')).toBeTruthy();
    expect(getByText('95')).toBeTruthy();
    expect(getByText('4.3')).toBeTruthy();
  });

  it('should calculate average activity percentage', () => {
    const { getByText } = renderWithTheme(
      <ThisWeeksAnalysis analytics={mockAnalytics} analyticsLoading={false} />
    );
    
    // (287 / 7) * 100 / 100 = 41%
    expect(getByText(/41%/)).toBeTruthy();
  });

  it('should show 0% when analytics is null', () => {
    const { getByText } = renderWithTheme(
      <ThisWeeksAnalysis analytics={null} analyticsLoading={false} />
    );
    
    expect(getByText('0%')).toBeTruthy();
  });
});
