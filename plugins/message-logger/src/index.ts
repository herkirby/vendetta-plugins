import { findByName, findByProps } from "@vendetta/metro";
import { FluxDispatcher, ReactNative } from "@vendetta/metro/common";
import { after, before, instead } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { writeFile, existsSync, mkdirSync } from "react-native-fs";
import { join } from "path";

const patches = [];
const ChannelMessages = findByProps("_channelMessages");
const MessageRecordUtils = findByProps("updateMessageRecord", "createMessageRecord");
const MessageRecord = findByName("MessageRecord", false);
const RowManager = findByName("RowManager");

const logDirectory = join(ReactNative.Platform.OS === "android" ? ReactNative.fs.ExternalDirectoryPath : ReactNative.fs.DocumentDirectoryPath, "deleted_messages");
if (!existsSync(logDirectory)) {
  mkdirSync(logDirectory);
}

patches.push(before("dispatch", FluxDispatcher, ([event]) => {
  if (event.type === "MESSAGE_DELETE") {
    if (event.__vml_cleanup) return event;

    const channel = ChannelMessages.get(event.channelId);
    const message = channel?.get(event.id);
    if (!message) return event;

    if (message.author?.id == "1") return event;
    if (message.state == "SEND_FAILED") return event;

    storage.nopk && fetch(`https://api.pluralkit.me/v2/messages/${encodeURIComponent(message.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (message.id === data.original && !data.member?.keep_proxy) {
          FluxDispatcher.dispatch({
            type: "MESSAGE_DELETE",
            id: message.id,
            channelId: message.channel_id,
            __vml_cleanup: true,
          });
        }
      });

    const logFilePath = join(logDirectory, `${event.channelId}.json`);
    const logEntry = JSON.stringify({
      message: message.toJS(),
      timestamp: Date.now(),
    }) + ",\n";

    if (existsSync(logFilePath)) {
      ReactNative.fs.appendFile(logFilePath, logEntry, "utf8");
    } else {
      ReactNative.fs.writeFile(logFilePath, "[" + logEntry, "utf8");
    }

    return [{
      message: {
        ...message.toJS(),
        __vml_deleted: true,
      },
      type: "MESSAGE_UPDATE",
    }];
  }
}));

patches.push(after("generate", RowManager.prototype, ([data], row) => {
  if (data.rowType !== 1) return;
  if (data.message.__vml_deleted) {
    row.message.edited = "deleted";
    row.backgroundHighlight ??= {};
    row.backgroundHighlight.backgroundColor = ReactNative.processColor("#da373c22");
    row.backgroundHighlight.gutterColor = ReactNative.processColor("#da373cff");
  }
}));

patches.push(instead("updateMessageRecord", MessageRecordUtils, function ([oldRecord, newRecord], orig) {
  if (newRecord.__vml_deleted) {
    return MessageRecordUtils.createMessageRecord(newRecord, oldRecord.reactions);
  }
  return orig.apply(this, [oldRecord, newRecord]);
}));

patches.push(after("createMessageRecord", MessageRecordUtils, function ([message], record) {
  record.__vml_deleted = message.__vml_deleted;
}));

patches.push(after("default", MessageRecord, ([props], record) => {
  record.__vml_deleted = !!props.__vml_deleted;
}));

export const onUnload = () => {
  patches.forEach((unpatch) => unpatch());

  for (const channelId in ChannelMessages._channelMessages) {
    const logFilePath = join(logDirectory, `${channelId}.json`);
    if (existsSync(logFilePath)) {
      const fileContent = ReactNative.fs.readFileSync(logFilePath, 'utf8');
      if (fileContent.endsWith(",\n")) {
        const fixedContent = fileContent.slice(0, -2) + "]";
        ReactNative.fs.writeFile(logFilePath, fixedContent, 'utf8');
      }
    }
    for (const message of ChannelMessages._channelMessages[channelId]._array) {
      message.__vml_deleted && FluxDispatcher.dispatch({
        type: "MESSAGE_DELETE",
        id: message.id,
        channelId: message.channel_id,
        __vml_cleanup: true,
      });
    }
  }
};

export { default as settings } from "./settings";
