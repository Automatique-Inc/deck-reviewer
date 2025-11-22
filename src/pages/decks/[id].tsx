import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { useFirebaseApp } from 'reactfire';

import Layout from '~/core/ui/Layout';
import Container from '~/core/ui/Container';
import Heading from '~/core/ui/Heading';
import SubHeading from '~/core/ui/SubHeading';
import SiteHeader from '~/components/SiteHeader';
import Footer from '~/components/Footer';
import { withTranslationProps } from '~/lib/props/with-translation-props';

interface Deck {
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  uploadedAt: any;
  processedAt?: any;
  status: 'uploaded' | 'extracting' | 'analyzing' | 'complete' | 'error';
  pageCount: number;
  uploadedBy: string | null;
  errorMessage?: string;
}

interface Insight {
  id: string;
  type: string;
  pageNumber: number;
  rating: number;
  feedback: string;
  reasoning: string;
  actorName: string;
  generatedAt: any;
}

interface Page {
  id: string;
  pageNumber: number;
  text: string;
  wordCount: number;
  status: string;
}

function DeckDetailPage() {
  const router = useRouter();
  const { id: deckId } = router.query;
  const app = useFirebaseApp();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deckId || typeof deckId !== 'string') return;

    const db = getFirestore(app);

    // Subscribe to deck document
    const deckUnsubscribe = onSnapshot(
      doc(db, 'decks', deckId),
      (snapshot) => {
        if (snapshot.exists()) {
          setDeck(snapshot.data() as Deck);
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    );

    // Subscribe to insights
    const insightsQuery = query(
      collection(db, 'decks', deckId, 'insights'),
      orderBy('generatedAt', 'asc')
    );

    const insightsUnsubscribe = onSnapshot(insightsQuery, (snapshot) => {
      const newInsights: Insight[] = [];
      snapshot.forEach((doc) => {
        newInsights.push({ id: doc.id, ...doc.data() } as Insight);
      });
      setInsights(newInsights);
    });

    // Subscribe to pages
    const pagesQuery = query(
      collection(db, 'decks', deckId, 'pages'),
      orderBy('pageNumber', 'asc')
    );

    const pagesUnsubscribe = onSnapshot(pagesQuery, (snapshot) => {
      const newPages: Page[] = [];
      snapshot.forEach((doc) => {
        newPages.push({ id: doc.id, ...doc.data() } as Page);
      });
      setPages(newPages);
    });

    return () => {
      deckUnsubscribe();
      insightsUnsubscribe();
      pagesUnsubscribe();
    };
  }, [deckId, app]);

  if (loading) {
    return (
      <Layout>
        <SiteHeader />
        <Container>
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading deck...</p>
          </div>
        </Container>
        <Footer />
      </Layout>
    );
  }

  if (!deck) {
    return (
      <Layout>
        <SiteHeader />
        <Container>
          <div className="py-16 text-center">
            <Heading type={1}>Deck Not Found</Heading>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              The deck you're looking for doesn't exist.
            </p>
          </div>
        </Container>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout>
      <SiteHeader />

      <Container>
        <div className="py-12">
          {/* Deck Header */}
          <div className="mb-8">
            <Heading type={1}>{deck.fileName}</Heading>
            <SubHeading className="mt-2">
              {getStatusMessage(deck.status, pages.length, deck.pageCount)}
            </SubHeading>

            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{(deck.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              <span>•</span>
              <span>{deck.pageCount || '?'} pages</span>
              <span>•</span>
              <span>{insights.length} insights</span>
            </div>
          </div>

          {/* Status Banner */}
          <DeckStatusBanner status={deck.status} errorMessage={deck.errorMessage} />

          {/* Insights Feed */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Insights</h2>

            {insights.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {deck.status === 'uploaded' || deck.status === 'extracting'
                    ? 'Extracting text from your deck...'
                    : 'Analyzing your deck... insights will appear here shortly.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            )}
          </div>

          {/* Pages List (Collapsible) */}
          {pages.length > 0 && (
            <div className="mt-12">
              <details className="group">
                <summary className="cursor-pointer text-lg font-semibold flex items-center">
                  <span>Extracted Pages ({pages.length})</span>
                  <svg
                    className="ml-2 h-5 w-5 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>

                <div className="mt-4 space-y-2">
                  {pages.map((page) => (
                    <PageCard key={page.id} page={page} />
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </Container>

      <Footer />
    </Layout>
  );
}

function getStatusMessage(status: string, extractedPages: number, totalPages: number): string {
  switch (status) {
    case 'uploaded':
      return 'Deck uploaded, waiting for processing...';
    case 'extracting':
      return 'Extracting text from PDF...';
    case 'analyzing':
      return `Analyzing deck (${extractedPages}/${totalPages} pages extracted)...`;
    case 'complete':
      return 'Analysis complete!';
    case 'error':
      return 'An error occurred during processing.';
    default:
      return status;
  }
}

function DeckStatusBanner({ status, errorMessage }: { status: string; errorMessage?: string }) {
  const statusConfig = {
    uploaded: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: '⏳',
    },
    extracting: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: '📄',
    },
    analyzing: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-800 dark:text-purple-200',
      icon: '🔍',
    },
    complete: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: '✅',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: '❌',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.uploaded;

  return (
    <div className={`rounded-lg p-4 border ${config.bg} ${config.border}`}>
      <div className="flex items-start">
        <span className="text-2xl mr-3">{config.icon}</span>
        <div className="flex-1">
          <p className={`font-semibold ${config.text}`}>
            {getStatusMessage(status, 0, 0)}
          </p>
          {errorMessage && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const ratingColor =
    insight.rating >= 7
      ? 'text-green-600 dark:text-green-400'
      : insight.rating >= 4
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg capitalize">{insight.type} - Page {insight.pageNumber}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">by {insight.actorName}</p>
        </div>
        <div className={`text-2xl font-bold ${ratingColor}`}>{insight.rating}/10</div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Feedback:</p>
          <p className="text-gray-800 dark:text-gray-200">{insight.feedback}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Reasoning:</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{insight.reasoning}</p>
        </div>
      </div>
    </div>
  );
}

function PageCard({ page }: { page: Page }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">Page {page.pageNumber}</h4>
        <span className="text-sm text-gray-500 dark:text-gray-400">{page.wordCount} words</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{page.text}</p>
    </div>
  );
}

export default DeckDetailPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { props } = await withTranslationProps({ locale: context.locale });

  return {
    props,
  };
}
