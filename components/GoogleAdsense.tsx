import Script from "next/script";
import { IS_ADSENSE_ACTIVE } from "../utils/constants";

type Props = {
    pId: string;
};

export const GoogleAdsense = ({ pId }: Props) => {
    if (process.env.NODE_ENV !== "production" || !IS_ADSENSE_ACTIVE) {
        return null;
    }

    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
};
