import {
  LinkingOptions,
  getStateFromPath as defaultGetStateFromPath,
  PartialState,
  NavigationState,
} from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '../types/navigation';
import { logger } from '../lib/logger';

/**
 * React Navigation linking configuration for Universal Links and deep links.
 *
 * Domain: app.emotionalpulse.ai (dedicated app subdomain — every URL on it
 * is an app target, so we claim "/" rather than individual paths).
 *
 * Two URL conventions coexist:
 *
 * 1. Query-string routing (notification URLs):
 *    https://app.emotionalpulse.ai/?page=<prefix><id>
 *      s<id>  → Support request detail screen
 *      p<id>  → Pair detail screen
 *      i<id>  → Group invite screen
 *
 * 2. Path-based routing (shareable links):
 *    https://app.emotionalpulse.ai/pair-invite?pair_token=…
 *    https://app.emotionalpulse.ai/group-invite?token=…
 *
 * The custom `getStateFromPath` handles (1); the default config handles (2).
 *
 * Screens for the ?page= prefixes don't exist yet — they're added in future
 * feature tickets shipped via OTA. Until then, the parser logs the deep link
 * target and routes to Main.
 */

/** Human-readable labels for ?page= prefixes (used in logs). */
const PAGE_PREFIX_LABELS: Record<string, string> = {
  s: 'SupportRequest',
  p: 'PairDetail',
  i: 'GroupInvite',
};

/**
 * Parse the `?page=` query parameter and return navigation state.
 * Returns `undefined` if the URL doesn't use the ?page= convention,
 * letting the caller fall through to default path-based resolution.
 */
function resolvePageParam(path: string): PartialState<NavigationState> | undefined {
  const queryStart = path.indexOf('?');
  if (queryStart === -1) return undefined;

  const params = new URLSearchParams(path.substring(queryStart + 1));
  const page = params.get('page');
  if (!page) return undefined;

  const match = page.match(/^([spi])(\d+)$/);
  if (match) {
    const [, prefix, id] = match;
    const label = PAGE_PREFIX_LABELS[prefix] ?? 'Unknown';

    // TODO: Route to actual screens when they're built.
    // When a screen is ready, add a case here that returns the correct
    // route state, e.g.:
    //   if (prefix === 's') {
    //     return { routes: [{ name: 'Main' }, { name: 'SupportRequestDetails', params: { id: Number(id) } }] };
    //   }
    logger.info(
      `[linking] Deep link: ?page=${page} → ${label} #${id} (screen not yet built, routing to Main)`,
    );
    return { routes: [{ name: 'Main' as const }] };
  }

  logger.warn(`[linking] Unrecognised ?page= value: "${page}", routing to Main`);
  return { routes: [{ name: 'Main' as const }] };
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'https://app.emotionalpulse.ai',
    Linking.createURL('/'), // resolves to emotionalpulse:// scheme
  ],

  config: {
    screens: {
      Main: '',
      PairInvite: {
        path: 'pair-invite',
        parse: {
          pair_token: (value: string) => value,
        },
      },
      GroupInviteAccept: {
        path: 'group-invite',
        parse: {
          token: (value: string) => value,
        },
      },
    },
  },

  getStateFromPath(path, options) {
    // 1. Try ?page= query-string convention first
    const pageState = resolvePageParam(path);
    if (pageState) return pageState;

    // 2. Fall through to default path-based resolution
    return defaultGetStateFromPath(path, options);
  },
};
