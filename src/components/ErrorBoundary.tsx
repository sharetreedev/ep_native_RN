import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { postBug } from '../lib/bugReporter';

// Global render-error boundary. Any uncaught error thrown during render
// anywhere below this component falls back to a friendly recovery UI
// instead of white-screening the whole app. A non-crashing experience
// matters for a mental-health app — a user in distress should always
// have a path forward.
//
// Failures are reported to the Xano `/bugs` endpoint (fire-and-forget,
// PII-scrubbed) so the backend team has visibility even without a full
// crash reporter wired up yet. Styling is inline so the fallback renders
// even if NativeWind / styling infra is what broke.

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ errorInfo: info });

    Sentry.captureException(error, {
      tags: { source: 'ErrorBoundary' },
      contexts: { react: { componentStack: info.componentStack } },
    });

    postBug({
      url: 'react-render',
      type: 'mobile native - react',
      description: `Render error: ${error.message}`,
      raw: {
        name: error.name,
        message: error.message,
        stack: error.stack?.slice(0, 4000),
        componentStack: info.componentStack?.slice(0, 4000),
      },
    });

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Something went wrong</Text>
        <Text style={styles.body}>
          Pulse hit an unexpected error and couldn&apos;t load this screen. We&apos;ve
          logged it so the team can take a look.
        </Text>
        <Text style={styles.body}>
          If you need immediate support, please reach out to your MHFR or call
          your local emergency line.
        </Text>

        <TouchableOpacity onPress={this.handleReset} style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>

        {__DEV__ && this.state.error && (
          <ScrollView style={styles.devPanel}>
            <Text style={styles.devError}>
              {this.state.error.name}: {this.state.error.message}
            </Text>
            {this.state.error.stack && (
              <Text style={styles.devStack}>{this.state.error.stack}</Text>
            )}
            {this.state.errorInfo?.componentStack && (
              <Text style={styles.devStack}>{this.state.errorInfo.componentStack}</Text>
            )}
          </ScrollView>
        )}
      </View>
    );
  }
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#EDE9E4',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#91A27D',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 24,
    minHeight: 56,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 16,
  },
  devPanel: {
    marginTop: 32,
    maxHeight: 400,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
  },
  devError: {
    color: '#D08A6E',
    fontSize: 12,
    marginBottom: 8,
  },
  devStack: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 8,
  },
};
