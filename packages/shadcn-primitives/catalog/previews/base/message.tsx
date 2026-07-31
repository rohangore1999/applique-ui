import {
  Example,
  ExampleWrapper,
} from "../../compat/example"
import {
  Avatar,
  AvatarFallback,
} from "../../../src/avatar"
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "../../../src/bubble"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "../../../src/message"

export default function MessagePreview() {
  return (
    <ExampleWrapper>
      <Example title="Conversation">
        <div className="flex w-full max-w-md flex-col gap-8">
          <Message align="end">
            <MessageContent>
              <Bubble>
                <BubbleContent>
                  Can we ship the dashboard update today?
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>

          <Message>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>AG</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <Bubble variant="muted">
                <BubbleContent>
                  Yes. The checks passed and the rollout is ready.
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </div>
      </Example>

      <Example title="Grouped content">
        <div className="flex w-full max-w-md flex-col gap-8">
          <Message>
            <MessageContent>
              <MessageHeader>Applique assistant · just now</MessageHeader>
              <MessageGroup>
                <BubbleGroup>
                  <Bubble variant="outline">
                    <BubbleContent>
                      The release contains the Button and Checkbox updates.
                    </BubbleContent>
                  </Bubble>
                  <Bubble variant="outline">
                    <BubbleContent>
                      Existing consumers can update when they are ready.
                    </BubbleContent>
                    <BubbleReactions aria-label="One approval">
                      👍 1
                    </BubbleReactions>
                  </Bubble>
                </BubbleGroup>
              </MessageGroup>
              <MessageFooter>Delivered</MessageFooter>
            </MessageContent>
          </Message>
        </div>
      </Example>
    </ExampleWrapper>
  )
}
