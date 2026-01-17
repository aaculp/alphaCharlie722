import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  items: FAQItem[];
}

/**
 * FAQSection Component
 * 
 * Displays a collapsible FAQ section with questions and answers.
 * Used in settings and help screens to provide comprehensive guidance.
 */
export const FAQSection: React.FC<FAQSectionProps> = ({
  title = 'Frequently Asked Questions',
  items,
}) => {
  const { theme } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
      )}
      <View style={[styles.faqList, { backgroundColor: theme.colors.surface }]}>
        {items.map((item, index) => (
          <View key={index}>
            <TouchableOpacity
              style={[
                styles.faqItem,
                { borderBottomColor: theme.colors.border },
                index === items.length - 1 && expandedIndex !== index && styles.lastItem,
              ]}
              onPress={() => toggleItem(index)}
              activeOpacity={0.7}
            >
              <View style={styles.questionContainer}>
                <Icon
                  name="help-circle-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.questionIcon}
                />
                <Text style={[styles.question, { color: theme.colors.text }]}>
                  {item.question}
                </Text>
              </View>
              <Icon
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            {expandedIndex === index && (
              <View
                style={[
                  styles.answerContainer,
                  { backgroundColor: theme.colors.background },
                  index === items.length - 1 && styles.lastAnswer,
                ]}
              >
                <Text style={[styles.answer, { color: theme.colors.textSecondary }]}>
                  {item.answer}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  faqList: {
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  questionIcon: {
    marginRight: 12,
  },
  question: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingLeft: 52,
  },
  lastAnswer: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
});
