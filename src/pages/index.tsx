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
      const { initializeApp, getApps } = await import('firebase/app');
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

      // Connect to emulator if in development
      // Note: connectStorageEmulator can only be called once per storage instance
      if (configuration.emulator) {
        try {
          const emulatorHost = configuration.emulatorHost ?? 'localhost';
          connectStorageEmulator(storage, emulatorHost, 9199);
        } catch (error) {
          // Ignore error if already connected to emulator
          if (!(error instanceof Error && error.message.includes('already'))) {
            throw error;
          }
        }
      }

      const timestamp = Date.now();
      const fileName = `decks/${timestamp}-${file.name}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);

      console.log('✅ File uploaded successfully:', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: file.type,
        storagePath: fileName,
        timestamp: new Date(timestamp).toISOString(),
      });

      // Show success toast
      const { toast } = await import('sonner');
      toast.success('Deck uploaded successfully!', {
        description: 'We\'ll analyze your pitch deck and get back to you soon.',
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
                Fuck?
              </span>
            </HeroTitle>

            <SubHeading className={'text-center'}>
              <span>Listen up, motherfucker. I&apos;m Russ Hanneman. Three commas, doors that go UP not out,</span>
              <span>the original trespasser who put radio on the goddamn internet and cashed out</span>
              <span>while you were still circle-jerking in your dorm room.</span>
              <br />
              <span>I&apos;ve seen more pitch decks than I&apos;ve had supermodels on my jet,</span>
              <span>and 99% of them are limp-dick garbage that couldn&apos;t close a screen door in a hurricane.</span>
              <br />
              <span>Upload yours. Right now. I&apos;ll tell you in 60 seconds if this thing fucks like a jackhammer</span>
              <span>or if it&apos;s just another flaccid slide show begging to get ghosted by every VC from Sand Hill to South Park.</span>
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
                No lube. No foreplay. Just brutal, ball-slapping truth.
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
              <Heading type={2}>How This Shit Actually Works</Heading>

              <SubHeading as={'h3'}>
                Three simple steps to find out if your deck fucks or dies alone
              </SubHeading>
            </div>
          </div>

          <div>
            <div className={'grid gap-12 lg:grid-cols-3'}>
              <div className={'flex flex-col space-y-2'}>
                <FeatureIcon>
                  <ArrowUpTrayIcon className={'h-5'} />
                </FeatureIcon>

                <h4 className={'text-lg font-semibold'}>1. You drop your sad little PDF in the box</h4>

                <div className={'text-gray-500 dark:text-gray-400 text-sm'}>
                  Like you&apos;re sliding into a term sheet you don&apos;t deserve.
                </div>
              </div>

              <div className={'flex flex-col space-y-2'}>
                <FeatureIcon>
                  <DocumentIcon className={'h-5'} />
                </FeatureIcon>

                <h4 className={'text-lg font-semibold'}>2. I skull-fuck every slide</h4>

                <div className={'text-gray-500 dark:text-gray-400 text-sm'}>
                  Market size real or just some hopium you pulled out of your ass? Traction look like actual revenue or just another vanity-metric circle jerk? Team slide got winners or a bunch of mouth-breathers who couldn&apos;t sell crack in a rehab?
                </div>
              </div>

              <div className={'flex flex-col space-y-2'}>
                <FeatureIcon>
                  <ChevronRightIcon className={'h-5'} />
                </FeatureIcon>

                <h4 className={'text-lg font-semibold'}>3. You get the Russ Verdict</h4>

                <div className={'text-gray-500 dark:text-gray-400 text-sm'}>
                  This Deck Fucks (rare, I might actually wire money) • This Deck Kinda Fucks But Needs Viagra • This Deck Is A Virgin That Will Die Alone. Full slide-by-slide evisceration. I&apos;ll tell you exactly which page made my dick soft and why your ask is the funniest shit I&apos;ve seen since Pied Piper&apos;s Series B.
                </div>
              </div>
            </div>
          </div>

          <div className={'max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/20 rounded-2xl p-8'}>
            <p className={'text-center text-base italic text-gray-700 dark:text-gray-300'}>
              &quot;I&apos;ve funded companies that hemorrhage cash like a hooker with a coke habit and still said &apos;This could be a 10x.&apos; Your deck? If it doesn&apos;t give me a half-chub while I&apos;m sipping Tres Comas tequila on my gull-wing roof… you&apos;re fucked. But not in the good way.&quot;
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
                  <Heading type={2}>Who The Fuck Am I To Judge Your Deck?</Heading>

                  <SubHeading as={'h3'}>
                    Three goddamn commas. 1,000,000,000. Say it with me.
                  </SubHeading>
                </div>

                <div className={'space-y-4'}>
                  <p>
                    I&apos;m not some polite little YC robot that blows smoke up your ass. I will straight-up tell you your revenue model is retarded, your TAM is a fairy tale you tell yourself at night, and your logo looks like it was designed by a blind intern on bath salts.
                  </p>
                  <ul className={'space-y-2 text-gray-600 dark:text-gray-400'}>
                    <li className={'flex items-start space-x-2'}>
                      <ChevronRightIcon className={'h-5 w-5 mt-0.5 text-primary'} />
                      <span>Turned radio into internet money and bounced before the bubble even thought about popping</span>
                    </li>
                    <li className={'flex items-start space-x-2'}>
                      <ChevronRightIcon className={'h-5 w-5 mt-0.5 text-primary'} />
                      <span>My doors go up. My bank account goes up. My standards? Through the fucking roof.</span>
                    </li>
                    <li className={'flex items-start space-x-2'}>
                      <ChevronRightIcon className={'h-5 w-5 mt-0.5 text-primary'} />
                      <span>I am the guy who decides if you eat ramen or lobster for the next decade</span>
                    </li>
                  </ul>
                  <p className={'text-sm'}>
                    But if your deck fucks? Holy shit. I&apos;ll scream it from my suicide doors while shotgunning champagne off a supermodel&apos;s ass.
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
              <Heading type={2}>Sample Russ Reviews</Heading>
              <SubHeading>Real ones coming soon</SubHeading>
            </div>

            <div className={'grid gap-8 lg:grid-cols-3 w-full'}>
              <div className={'flex flex-col space-y-3 p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800'}>
                <div className={'flex items-center justify-between'}>
                  <span className={'text-sm font-semibold text-green-700 dark:text-green-400'}>THIS FUCKS</span>
                  <span className={'text-2xl'}>💰</span>
                </div>
                <p className={'text-sm italic text-gray-700 dark:text-gray-300'}>
                  &quot;Motherfucker… this deck just impregnated my portfolio.&quot;
                </p>
                <p className={'text-xs text-gray-500 dark:text-gray-400'}>
                  — On a deck that actually fucks
                </p>
              </div>

              <div className={'flex flex-col space-y-3 p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800'}>
                <div className={'flex items-center justify-between'}>
                  <span className={'text-sm font-semibold text-red-700 dark:text-red-400'}>DOES NOT FUCK</span>
                  <span className={'text-2xl'}>🚪</span>
                </div>
                <p className={'text-sm italic text-gray-700 dark:text-gray-300'}>
                  &quot;I&apos;ve seen hookers with more realistic projections.&quot;
                </p>
                <p className={'text-xs text-gray-500 dark:text-gray-400'}>
                  — On a deck with fantasy financials
                </p>
              </div>

              <div className={'flex flex-col space-y-3 p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800'}>
                <div className={'flex items-center justify-between'}>
                  <span className={'text-sm font-semibold text-yellow-700 dark:text-yellow-400'}>RARE PRAISE</span>
                  <span className={'text-2xl'}>🔥</span>
                </div>
                <p className={'text-sm italic text-gray-700 dark:text-gray-300'}>
                  &quot;This is the first deck in months that didn&apos;t make me want to jump off my gull-wing roof.&quot;
                </p>
                <p className={'text-xs text-gray-500 dark:text-gray-400'}>
                  — High praise from Russ
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
              Stop sending flaccid, blue-ball decks to investors.
            </p>
            <p className={'text-base text-gray-600 dark:text-gray-400 mt-2'}>
              Make that shit hard. Make it close. Upload your deck right fucking now… or keep wondering why every term sheet says &quot;pass harder than Russ Hanneman on a bad pitch.&quot;
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
        <span>{uploading ? 'Uploading...' : 'Show Me Your Deck, Bitch'}</span>
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
