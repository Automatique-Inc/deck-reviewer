import Image from 'next/image';
import { GetStaticPropsContext } from 'next';
import { useState, useRef } from 'react';

import {
  BuildingLibraryIcon,
  CubeIcon,
  DocumentIcon,
  PaintBrushIcon,
  UserGroupIcon,
  UserIcon,
  ChevronRightIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

import Container from '~/core/ui/Container';
import SubHeading from '~/core/ui/SubHeading';
import Button from '~/core/ui/Button';
import Divider from '~/core/ui/Divider';
import Heading from '~/core/ui/Heading';
import Layout from '~/core/ui/Layout';
import SiteHeader from '~/components/SiteHeader';
import { withTranslationProps } from '~/lib/props/with-translation-props';
import Footer from '~/components/Footer';
import PricingTable from '~/components/PricingTable';
import { Toaster } from 'sonner';

function Index() {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploading(true);

    try {
      // Dynamic import to avoid loading Firebase on the server
      const { getStorage, ref, uploadBytes, connectStorageEmulator } = await import('firebase/storage');
      const { getFirestore, collection, addDoc, serverTimestamp, connectFirestoreEmulator } = await import('firebase/firestore');
      const { initializeApp, getApps } = await import('firebase/app');
      const { useRouter } = await import('next/router');
      const configuration = (await import('~/configuration')).default;

      // Initialize Firebase if not already initialized
      let app;
      if (getApps().length === 0) {
        app = initializeApp({
          apiKey: configuration.firebase.apiKey,
          authDomain: configuration.firebase.authDomain,
          projectId: configuration.firebase.projectId,
          storageBucket: configuration.firebase.storageBucket,
          messagingSenderId: configuration.firebase.messagingSenderId,
          appId: configuration.firebase.appId,
        });
      } else {
        app = getApps()[0];
      }

      const storage = getStorage(app);
      const firestore = getFirestore(app);

      // Connect to emulators if in development
      if (configuration.emulator) {
        try {
          const emulatorHost = configuration.emulatorHost ?? 'localhost';
          connectStorageEmulator(storage, emulatorHost, 9199);
          connectFirestoreEmulator(firestore, emulatorHost, 8080);
        } catch (error) {
          // Ignore error if already connected to emulators
          if (!(error instanceof Error && error.message.includes('already'))) {
            throw error;
          }
        }
      }

      const timestamp = Date.now();
      const fileName = `decks/${timestamp}-${file.name}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);

      console.log('✅ File uploaded to storage:', {
        fileName: file.name,
        storagePath: fileName,
      });

      // Create deck document in Firestore
      const deckRef = await addDoc(collection(firestore, 'decks'), {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath: fileName,
        uploadedAt: serverTimestamp(),
        status: 'uploaded',
        pageCount: 0,
        uploadedBy: null, // anonymous upload
      });

      console.log('✅ Deck document created:', {
        deckId: deckRef.id,
      });

      // Show success toast
      const { toast } = await import('sonner');
      toast.success('Deck uploaded successfully!', {
        description: 'Redirecting to analysis page...',
      });

      // Redirect to deck detail page
      const router = (await import('next/router')).default.useRouter ?
        window.location : null;

      // Use window.location for redirect (simpler than router hook)
      setTimeout(() => {
        window.location.href = `/decks/${deckRef.id}`;
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      const { toast } = await import('sonner');
      toast.error('Upload failed', {
        description: 'Please try again or contact support if the issue persists.',
      });
    } finally {
      setUploading(false);
    }
  };
  return (
    <Layout>
      <Toaster position="top-center" />
      <SiteHeader />

      <Container>
        <div
          className={
            'my-12 flex flex-col items-center md:flex-row lg:my-16' +
            ' mx-auto flex-1 justify-center animate-in fade-in ' +
            ' duration-1000 slide-in-from-top-12'
          }
        >
          <div className={'flex w-full flex-1 flex-col items-center space-y-8'}>
            <Pill>
              <span>Three Commas. Radio on the Internet. Zero BS.</span>
            </Pill>

            <HeroTitle>
              <span>Does Your Deck</span>
              <span
                className={
                  'bg-gradient-to-br bg-clip-text text-transparent' +
                  ' from-primary-400 to-primary-700 leading-[1.2]'
                }
              >
                Actually Slap?
              </span>
            </HeroTitle>

            <SubHeading className={'text-center'}>
              <span>I&apos;ve seen more decks than I&apos;ve had avocados on my private jet toast.</span>
              <span>Upload yours and I&apos;ll tell you straight: does this thing have potential,</span>
              <span>or is it just another virgin pitch that&apos;s gonna get laughed out of the term sheet?</span>
            </SubHeading>

            <div className={'flex flex-col items-center space-y-4'}>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <MainCallToActionButton
                onClick={handleUploadClick}
                uploading={uploading}
              />

              <span className={'text-xs text-gray-500 dark:text-gray-400'}>
                No safe spaces. No participation trophies. Upload your PDF. Get the truth.
              </span>
            </div>
          </div>
        </div>

        <div
          className={
            'flex justify-center py-12 max-w-5xl mx-auto animate-in fade-in ' +
            ' duration-1000 slide-in-from-top-16 fill-mode-both delay-300'
          }
        >
          <Image
            priority
            className={
              'shadow-[0_0_1000px_0] rounded-2xl' +
              ' shadow-primary/40 animate-in fade-in' +
              ' zoom-in-50 delay-300 duration-1000 ease-out fill-mode-both'
            }
            width={2688}
            height={1824}
            src={`/assets/images/dashboard-dark.webp`}
            alt={`App Image`}
          />
        </div>
      </Container>

      <Container>
        <div
          className={
            'flex flex-col items-center justify-center space-y-24 py-16'
          }
        >
          <div
            className={
              'flex max-w-3xl flex-col items-center space-y-6 text-center'
            }
          >
            <Pill>It&apos;s Not Rocket Science, Richard</Pill>

            <div className={'flex flex-col space-y-0.5'}>
              <Heading type={2}>How This Works</Heading>

              <SubHeading as={'h3'}>
                Three simple steps to find out if your deck has what it takes
              </SubHeading>
            </div>
          </div>

          <div>
            <div className={'grid gap-12 lg:grid-cols-3'}>
              <div className={'flex flex-col space-y-2'}>
                <FeatureIcon>
                  <ArrowUpTrayIcon className={'h-5'} />
                </FeatureIcon>

                <h4 className={'text-lg font-semibold'}>1. Upload Your Deck</h4>

                <div className={'text-gray-500 dark:text-gray-400 text-sm'}>
                  Drag it in like you&apos;re sneaking into the three comma club. PDF only – none of that PowerPoint nonsense.
                </div>
              </div>

              <div className={'flex flex-col space-y-2'}>
                <FeatureIcon>
                  <DocumentIcon className={'h-5'} />
                </FeatureIcon>

                <h4 className={'text-lg font-semibold'}>2. Get It Reviewed</h4>

                <div className={'text-gray-500 dark:text-gray-400 text-sm'}>
                  We&apos;ll tear it apart like a billionaire with a grudge. Market size, traction, team – everything gets scrutinized.
                </div>
              </div>

              <div className={'flex flex-col space-y-2'}>
                <FeatureIcon>
                  <ChevronRightIcon className={'h-5'} />
                </FeatureIcon>

                <h4 className={'text-lg font-semibold'}>3. Get The Verdict</h4>

                <div className={'text-gray-500 dark:text-gray-400 text-sm'}>
                  Full breakdown, slide-by-slide roasting. What slaps, what needs to go back to the incubator. Zero BS.
                </div>
              </div>
            </div>
          </div>

          <div className={'max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/20 rounded-2xl p-8'}>
            <p className={'text-center text-base italic text-gray-700 dark:text-gray-300'}>
              &quot;Look, I&apos;ve funded companies that lose money every quarter. Pinterest? Snapchat? No revenue? That&apos;s hot. But your deck? If it doesn&apos;t make me want to write a check while refreshing my net worth... we&apos;re gonna have problems.&quot;
            </p>
          </div>
        </div>
      </Container>

      <Container>
        <div className={'flex flex-col space-y-16 py-16'}>
          <FeatureShowcaseContainer>
            <LeftFeatureContainer>
              <div className={'flex flex-col space-y-4'}>
                <Pill>This Guy Reviews</Pill>

                <div className={'flex flex-col'}>
                  <Heading type={2}>Why Listen To Me?</Heading>

                  <SubHeading as={'h3'}>
                    Three commas in the bank. Been there, crushed that.
                  </SubHeading>
                </div>

                <div className={'space-y-4'}>
                  <p>
                    I&apos;m not some polite YC bot. I&apos;ve funded companies that made grown VCs cry... and not in the good way.
                  </p>
                  <ul className={'space-y-2 text-gray-600 dark:text-gray-400'}>
                    <li className={'flex items-start space-x-2'}>
                      <ChevronRightIcon className={'h-5 w-5 mt-0.5 text-primary'} />
                      <span>Put radio on the internet (you&apos;re welcome)</span>
                    </li>
                    <li className={'flex items-start space-x-2'}>
                      <ChevronRightIcon className={'h-5 w-5 mt-0.5 text-primary'} />
                      <span>Built companies that actually made it to the three comma club</span>
                    </li>
                    <li className={'flex items-start space-x-2'}>
                      <ChevronRightIcon className={'h-5 w-5 mt-0.5 text-primary'} />
                      <span>Seen more decks than most VCs see in a lifetime</span>
                    </li>
                  </ul>
                  <p className={'text-sm'}>
                    If your deck slaps, I&apos;ll tell you. If your revenue model is fantasy football, I&apos;ll tell you that too.
                  </p>
                </div>

                <div>
                  <Button round variant={'outline'} href={'/auth/sign-up'}>
                    <span className={'flex space-x-2 items-center'}>
                      <span>Get Started</span>
                      <ChevronRightIcon className={'h-3'} />
                    </span>
                  </Button>
                </div>
              </div>
            </LeftFeatureContainer>

            <RightFeatureContainer>
              <Image
                className="rounded-2xl"
                src={'/assets/images/dashboard-dark.webp'}
                width={'887'}
                height={'743'}
                alt={'Dashboard'}
              />
            </RightFeatureContainer>
          </FeatureShowcaseContainer>

          <div className={'flex flex-col space-y-8 items-center'}>
            <div className={'flex flex-col items-center space-y-2 text-center'}>
              <Heading type={2}>Real Reviews (Kind Of)</Heading>
              <SubHeading>What happens when decks meet brutal honesty</SubHeading>
            </div>

            <div className={'grid gap-8 lg:grid-cols-3 w-full'}>
              <div className={'flex flex-col space-y-3 p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800'}>
                <div className={'flex items-center justify-between'}>
                  <span className={'text-sm font-semibold text-green-700 dark:text-green-400'}>SLAPS</span>
                  <span className={'text-2xl'}>💰</span>
                </div>
                <p className={'text-sm italic text-gray-700 dark:text-gray-300'}>
                  &quot;This deck slaps so hard I almost joined the four comma club.&quot;
                </p>
                <p className={'text-xs text-gray-500 dark:text-gray-400'}>
                  — On a Series A that raised $50M
                </p>
              </div>

              <div className={'flex flex-col space-y-3 p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800'}>
                <div className={'flex items-center justify-between'}>
                  <span className={'text-sm font-semibold text-red-700 dark:text-red-400'}>DOES NOT SLAP</span>
                  <span className={'text-2xl'}>🚪</span>
                </div>
                <p className={'text-sm italic text-gray-700 dark:text-gray-300'}>
                  &quot;These are not the slides of a billionaire.&quot;
                </p>
                <p className={'text-xs text-gray-500 dark:text-gray-400'}>
                  — On a deck with Comic Sans
                </p>
              </div>

              <div className={'flex flex-col space-y-3 p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800'}>
                <div className={'flex items-center justify-between'}>
                  <span className={'text-sm font-semibold text-yellow-700 dark:text-yellow-400'}>RARE PRAISE</span>
                  <span className={'text-2xl'}>🔥</span>
                </div>
                <p className={'text-sm italic text-gray-700 dark:text-gray-300'}>
                  &quot;Now that&apos;s what I&apos;m talking about.&quot;
                </p>
                <p className={'text-xs text-gray-500 dark:text-gray-400'}>
                  — Happens about 1% of the time
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <Container>
        <div
          className={
            'flex flex-col items-center justify-center py-16 space-y-16'
          }
        >
          <div className={'flex flex-col items-center space-y-8 text-center'}>
            <Pill>
              Try before you invest. No doors will be slammed (yet).
            </Pill>

            <div className={'flex flex-col space-y-2.5'}>
              <Heading type={1}>
                Ready to Join the Three Comma Club?
              </Heading>

              <SubHeading>
                Start with our free plan. Upgrade when you&apos;re ready to make your deck actually slap.
              </SubHeading>
            </div>
          </div>

          <div className={'w-full'}>
            <PricingTable />
          </div>

          <div className={'max-w-2xl text-center'}>
            <p className={'text-lg font-medium text-gray-700 dark:text-gray-300'}>
              Stop sending virgin decks to investors.
            </p>
            <p className={'text-base text-gray-600 dark:text-gray-400 mt-2'}>
              Upload now or forever hold your L.
            </p>
          </div>
        </div>
      </Container>

      <Footer />
    </Layout>
  );
}

export default Index;

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  const { props } = await withTranslationProps({ locale });

  return {
    props,
  };
}

function HeroTitle({ children }: React.PropsWithChildren) {
  return (
    <h1
      className={
        'text-center text-4xl text-gray-600 dark:text-white md:text-5xl' +
        ' flex flex-col font-heading font-medium xl:text-7xl 2xl:text-[5.2rem]'
      }
    >
      {children}
    </h1>
  );
}

function FeatureIcon(props: React.PropsWithChildren) {
  return (
    <div className={'flex'}>
      <div
        className={
          'rounded-xl bg-primary/5 p-4 dark:bg-background border' +
          ' border-primary/5 dark:border-dark-800'
        }
      >
        {props.children}
      </div>
    </div>
  );
}

function Pill(props: React.PropsWithChildren) {
  return (
    <h2
      className={
        'inline-flex w-auto items-center space-x-2' +
        ' rounded-full bg-gradient-to-br dark:from-gray-200 dark:via-gray-400' +
        ' dark:to-gray-700 bg-clip-text px-4 py-2 text-center text-sm' +
        ' font-normal text-gray-500 dark:text-transparent shadow' +
        ' dark:shadow-dark-700'
      }
    >
      <span>{props.children}</span>
    </h2>
  );
}

function FeatureShowcaseContainer(props: React.PropsWithChildren) {
  return (
    <div
      className={
        'flex flex-col lg:flex-row items-center justify-between' +
        ' lg:space-x-24'
      }
    >
      {props.children}
    </div>
  );
}

function LeftFeatureContainer(props: React.PropsWithChildren) {
  return (
    <div className={'flex flex-col space-y-8 w-full lg:w-6/12'}>
      {props.children}
    </div>
  );
}

function RightFeatureContainer(props: React.PropsWithChildren) {
  return <div className={'flex w-full lg:w-6/12'}>{props.children}</div>;
}

function MainCallToActionButton({
  onClick,
  uploading,
}: {
  onClick: () => void;
  uploading: boolean;
}) {
  return (
    <Button
      className={
        'bg-transparent bg-gradient-to-r shadow-2xl' +
        ' hover:shadow-primary/60 from-primary' +
        ' to-primary-600 hover:to-indigo-600 text-white'
      }
      variant={'custom'}
      size={'lg'}
      round
      onClick={onClick}
      disabled={uploading}
    >
      <span className={'flex items-center space-x-2'}>
        <span>{uploading ? 'Uploading...' : 'Show Me If Your Deck Slaps'}</span>
        <ArrowUpTrayIcon
          className={
            'h-4 animate-in fade-in slide-in-from-left-8' +
            ' delay-1000 fill-mode-both duration-1000 zoom-in'
          }
        />
      </span>
    </Button>
  );
}
