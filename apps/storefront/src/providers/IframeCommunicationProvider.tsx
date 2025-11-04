import { useShopper } from '@ordercloud/react-sdk';
import { Tokens } from 'ordercloud-javascript-sdk';
import React, { createContext, useEffect, ReactNode } from 'react';

interface IframeCommunicationContextProps {
}

const IframeCommunicationContext = createContext<IframeCommunicationContextProps | null>(null);

interface ProviderProps {
  children: ReactNode;
  iframeOrigin: string;
}

export const IframeCommunicationProvider: React.FC<ProviderProps> = ({
  children,
  iframeOrigin
}) => {
  const { refreshWorksheet } = useShopper();

  useEffect(() => {
    console.log('[HOST] IframeCommunicationProvider mounted, setting up message listener');
    const handler = (event: MessageEvent) => {
      if (event.origin !== iframeOrigin) {
        console.log('[HOST] Ignoring message from unknown origin:', event.origin);
        return;
      }

      if (event.data?.type === 'REQUEST_TOKEN') {
        console.log('[HOST] Iframe is requesting token, sending token...');

        const token = Tokens.GetAccessToken();
        event?.source?.postMessage(
          { type: 'TOKEN', payload: token },
          {targetOrigin: event.origin}
        );
      } else if (event.data?.type === 'REQUEST_REFRESH_CART') {
        console.log('[HOST] Iframe requested cart refresh, refreshing cart');
        refreshWorksheet();
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [iframeOrigin, refreshWorksheet]);


  return (
    <IframeCommunicationContext.Provider value={{ }}>
      {children}
    </IframeCommunicationContext.Provider>
  );
};