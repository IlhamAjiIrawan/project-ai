'use client';

import React from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function ChatPage() {
  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <ChatInterface />
    </div>
  );
}
