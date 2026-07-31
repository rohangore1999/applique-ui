"use client"

import {
  Example,
  ExampleWrapper,
} from "../../compat/example"
import { Bubble, BubbleContent } from "../../../src/bubble"
import {
  Message,
  MessageContent,
} from "../../../src/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../../../src/message-scroller"

const messages = [
  {
    id: "request",
    role: "user",
    text: "Summarise today's dashboard rollout.",
  },
  {
    id: "response-1",
    role: "assistant",
    text: "The release is healthy across the pilot dashboards.",
  },
  {
    id: "response-2",
    role: "assistant",
    text: "Button and Checkbox now use the shared Applique tokens. No blocking errors were reported during the staged rollout.",
  },
  {
    id: "follow-up",
    role: "user",
    text: "Great—share the registry update with the remaining teams.",
  },
] as const

export default function MessageScrollerPreview() {
  return (
    <ExampleWrapper>
      <Example title="Scrollable conversation" className="h-96 p-0">
        <MessageScrollerProvider>
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent className="p-6">
                {messages.map((message) => (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={message.id}
                    scrollAnchor={message.role === "user"}
                  >
                    <Message
                      align={message.role === "user" ? "end" : "start"}
                    >
                      <MessageContent>
                        <Bubble
                          variant={
                            message.role === "user" ? "default" : "muted"
                          }
                        >
                          <BubbleContent>{message.text}</BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </Example>
    </ExampleWrapper>
  )
}
