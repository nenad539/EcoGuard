import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export const useRealtimeStatus = () => {
  const [connected, setConnected] = useState(supabase.realtime.isConnected());

  useEffect(() => {
    const realtime = supabase.realtime;
    const handleOpen = () => setConnected(true);
    const handleClose = () => setConnected(false);

    realtime.stateChangeCallbacks.open.push(handleOpen);
    realtime.stateChangeCallbacks.close.push(handleClose);
    realtime.stateChangeCallbacks.error.push(handleClose);

    setConnected(realtime.isConnected());

    return () => {
      realtime.stateChangeCallbacks.open = realtime.stateChangeCallbacks.open.filter(
        (cb) => cb !== handleOpen
      );
      realtime.stateChangeCallbacks.close = realtime.stateChangeCallbacks.close.filter(
        (cb) => cb !== handleClose
      );
      realtime.stateChangeCallbacks.error = realtime.stateChangeCallbacks.error.filter(
        (cb) => cb !== handleClose
      );
    };
  }, []);

  return connected;
};
