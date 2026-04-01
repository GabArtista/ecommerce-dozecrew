import clsx from "clsx";
import {
  getImageBackdropStyle,
  shouldBypassImageOptimization,
} from "lib/image";
import Image from "next/image";
import Label from "../label";

export function GridTileImage({
  isInteractive = true,
  active,
  label,
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  label?: {
    title: string;
    amount: string;
    currencyCode: string;
    position?: "bottom" | "center";
  };
} & React.ComponentProps<typeof Image>) {
  return (
    <div
      className={clsx(
        "group flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-white hover:border-blue-600 dark:bg-black",
        {
          relative: label,
          "border-2 border-blue-600": active,
          "border-neutral-200 dark:border-neutral-800": !active,
        },
      )}
    >
      {props.src ? (
        <>
          <div aria-hidden="true" className="absolute inset-0">
            <div
              className="absolute inset-[-16%] scale-125 bg-cover bg-center opacity-95 blur-3xl saturate-[1.8] brightness-95"
              style={
                typeof props.src === "string"
                  ? getImageBackdropStyle(props.src)
                  : undefined
              }
            />
            <div className="absolute inset-0 bg-white/18 backdrop-blur-lg dark:bg-black/18" />
          </div>
          <Image
            className={clsx("relative z-10 h-full w-full object-contain", {
              "transition duration-300 ease-in-out group-hover:scale-105":
                isInteractive,
            })}
            unoptimized={
              typeof props.src === "string" &&
              shouldBypassImageOptimization(props.src)
            }
            {...props}
          />
        </>
      ) : null}
      {label ? (
        <Label
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </div>
  );
}
