import * as bunyan from "bunyan";

export function createChildLogger(logger: bunyan.Logger, className: string) {
  return logger.child({ child: "rokot-mq-rabbit", "class": className }, true);
}
