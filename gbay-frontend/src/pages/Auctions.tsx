import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { getProductImageUrl } from "../utils/urls";

type Auction = {
  auction_id: number;
  product_id: number;
  title: string;
  description: string;
  image_path: string | null;
  seller_id: number;
  seller_name: string;
  start_price: number;
  fixed_price: number;
  current_price: number;
  start_time: string;
  end_time: string;
  status: "pending" | "active" | "ended";
  interested_count: number;
  bid_count: number;
  is_interested: number;
};

type Bid = {
  bidder_id: number;
  bid_amount: number;
  bid_time: string | null;
  username: string;
  offered_price?: number;
};

type Profile = {
  user_id: number;
  username: string;
};

type ClockState = {
  phase: "upcoming" | "live" | "ended";
  label: string;
  timeLeft: string;
};

type PanelSize = "compact" | "comfortable" | "expanded";

const panelSizeOptions: Array<{
  value: PanelSize;
  label: string;
  hint: string;
}> = [
  { value: "compact", label: "Compact", hint: "More panels on screen" },
  { value: "comfortable", label: "Comfortable", hint: "Balanced reading space" },
  { value: "expanded", label: "Expanded", hint: "Larger panel focus" },
];

function formatMoney(value: number) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDuration(ms: number) {
  const safeMs = Math.max(ms, 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function getClockState(startTime: string, endTime: string, nowMs: number): ClockState {
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || nowMs >= endMs) {
    return { phase: "ended", label: "Auction ended", timeLeft: "00:00:00" };
  }

  if (nowMs < startMs) {
    return {
      phase: "upcoming",
      label: "Starts in",
      timeLeft: formatDuration(startMs - nowMs),
    };
  }

  return {
    phase: "live",
    label: "Ends in",
    timeLeft: formatDuration(endMs - nowMs),
  };
}

function getImage(imagePath: string | null) {
  if (!imagePath) {
    return "https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=900&q=80";
  }
  const productImage = getProductImageUrl(imagePath);
  if (!productImage) {
    return "https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=900&q=80";
  }
  return productImage;
}

export default function Auctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [bidsByAuction, setBidsByAuction] = useState<Record<number, Bid[]>>({});
  const [bidAmountByAuction, setBidAmountByAuction] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [placingBidFor, setPlacingBidFor] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [nowMs, setNowMs] = useState(Date.now());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [panelSize, setPanelSize] = useState<PanelSize>(() => {
    const savedSize = window.localStorage.getItem("auction-panel-size");
    if (savedSize === "compact" || savedSize === "comfortable" || savedSize === "expanded") {
      return savedSize;
    }
    return "comfortable";
  });

  const goBack = () => {
    window.history.back();
  };

  const fetchAuctions = async () => {
    try {
      const [auctionRes, profileRes] = await Promise.all([
        api.get("/auction/list"),
        api.get("/user/me"),
      ]);

      const auctionRows: Auction[] = auctionRes.data || [];
      setAuctions(auctionRows);
      setProfile(profileRes.data || null);

      const sortedIds = auctionRows.map((a) => a.auction_id);
      const bidsResponses = await Promise.all(
        sortedIds.map((auctionId) => api.get(`/auction/${auctionId}/bids`))
      );

      const bidMap: Record<number, Bid[]> = {};
      bidsResponses.forEach((res, index) => {
        bidMap[sortedIds[index]] = res.data || [];
      });

      setBidsByAuction(bidMap);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Unable to load auctions right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
    const refreshId = window.setInterval(fetchAuctions, 15000);
    const tickerId = window.setInterval(() => setNowMs(Date.now()), 1000);

    return () => {
      window.clearInterval(refreshId);
      window.clearInterval(tickerId);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("auction-panel-size", panelSize);
  }, [panelSize]);

  const placeBid = async (auction: Auction) => {
    const raw = bidAmountByAuction[auction.auction_id];
    const amount = Number(raw);

    setError("");
    setSuccess("");

    if (Number.isNaN(amount)) {
      setError("Enter a valid bid amount.");
      return;
    }

    if (amount < Number(auction.start_price)) {
      setError(`Bid cannot be below base price (${formatMoney(auction.start_price)}).`);
      return;
    }

    if (amount <= Number(auction.current_price)) {
      setError("Bid must be greater than current highest bid.");
      return;
    }

    try {
      setPlacingBidFor(auction.auction_id);
      await api.post("/auction/bid", {
        auction_id: auction.auction_id,
        bid_amount: amount,
      });

      setSuccess(`Bid placed on ${auction.title}.`);
      setBidAmountByAuction((prev) => ({ ...prev, [auction.auction_id]: "" }));
      await fetchAuctions();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to place bid.");
    } finally {
      setPlacingBidFor(null);
    }
  };

  const auctionCards = useMemo(() => {
    return auctions.map((auction) => {
      const clock = getClockState(auction.start_time, auction.end_time, nowMs);
      const isSeller = profile?.user_id === auction.seller_id;
      const canBid = clock.phase === "live" && auction.is_interested === 1 && !isSeller;
      const topBids = bidsByAuction[auction.auction_id] || [];

      return {
        ...auction,
        clock,
        isSeller,
        canBid,
        topBids,
      };
    });
  }, [auctions, bidsByAuction, nowMs, profile?.user_id]);

  const panelLayout = useMemo(() => {
    if (panelSize === "compact") {
      return {
        grid: "grid grid-cols-1 2xl:grid-cols-3 xl:grid-cols-2 gap-4",
        article: "rounded-2xl overflow-hidden border border-orange-200 bg-white shadow-[0_10px_30px_rgba(234,88,12,0.12)]",
        innerGrid: "grid grid-cols-1",
        imageWrap: "h-44",
        body: "p-4",
        title: "text-lg font-bold text-gray-900 leading-tight",
        timer: "text-2xl font-black tabular-nums",
      };
    }

    if (panelSize === "expanded") {
      return {
        grid: "grid grid-cols-1 gap-6",
        article: "rounded-3xl overflow-hidden border border-orange-200 bg-white shadow-[0_16px_40px_rgba(234,88,12,0.14)]",
        innerGrid: "grid grid-cols-1 lg:grid-cols-5",
        imageWrap: "lg:col-span-2 h-64 lg:h-full",
        body: "lg:col-span-3 p-6",
        title: "text-2xl font-bold text-gray-900 leading-tight",
        timer: "text-4xl font-black tabular-nums",
      };
    }

    return {
      grid: "grid grid-cols-1 xl:grid-cols-2 gap-6",
      article: "rounded-2xl overflow-hidden border border-orange-200 bg-white shadow-[0_10px_30px_rgba(234,88,12,0.12)]",
      innerGrid: "grid grid-cols-1 sm:grid-cols-5",
      imageWrap: "sm:col-span-2 h-48 sm:h-full",
      body: "sm:col-span-3 p-5",
      title: "text-xl font-bold text-gray-900 leading-tight",
      timer: "text-3xl font-black tabular-nums",
    };
  }, [panelSize]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white/90 shadow-xl border border-orange-200 px-8 py-6 text-gray-700 font-semibold">
          Loading auction arena...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed_0%,_#ffedd5_35%,_#fecaca_100%)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl bg-white/85 backdrop-blur border border-orange-200 shadow-[0_20px_60px_rgba(194,65,12,0.18)] p-6 md:p-8">
          <button
            type="button"
            onClick={goBack}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm transition hover:border-orange-400 hover:bg-orange-50"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">Auction Arena</h2>
              <p className="text-gray-600 mt-1">
                See countdowns before start, live bid race during auction, and ranked highest offers in real time.
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="text-sm font-semibold text-orange-700 bg-orange-100 rounded-full px-4 py-2 w-fit">
                Synced every 15 seconds
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-1.5 shadow-sm">
                <div className="flex flex-wrap gap-1.5">
                  {panelSizeOptions.map((option) => {
                    const isActive = panelSize === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPanelSize(option.value)}
                        className={`rounded-xl px-3 py-2 text-left transition ${
                          isActive
                            ? "bg-white text-orange-700 shadow-sm ring-1 ring-orange-300"
                            : "text-gray-600 hover:bg-white/80 hover:text-orange-700"
                        }`}
                      >
                        <span className="block text-sm font-bold">{option.label}</span>
                        <span className="block text-[11px] leading-4 opacity-80">{option.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-300 bg-red-50 text-red-700 px-4 py-3">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 px-4 py-3">
              {success}
            </div>
          )}

          {auctionCards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50/70 p-10 text-center text-gray-600">
              No auctions scheduled yet.
            </div>
          ) : (
            <div className={panelLayout.grid}>
              {auctionCards.map((auction) => (
                <article
                  key={auction.auction_id}
                  className={panelLayout.article}
                >
                  <div className={panelLayout.innerGrid}>
                    <div className={panelLayout.imageWrap}>
                      <img
                        src={getImage(auction.image_path)}
                        alt={auction.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className={panelLayout.body}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className={panelLayout.title}>{auction.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">Seller: {auction.seller_name}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            auction.clock.phase === "live"
                              ? "bg-emerald-100 text-emerald-700"
                              : auction.clock.phase === "upcoming"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {auction.clock.phase}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{auction.description || "No description"}</p>

                      <div className="mt-4 rounded-xl bg-gray-900 text-white p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-orange-300">{auction.clock.label}</p>
                        <p className={panelLayout.timer}>{auction.clock.timeLeft}</p>
                        <p className="text-xs text-gray-300 mt-1">
                          Start: {new Date(auction.start_time).toLocaleString()} | End: {new Date(auction.end_time).toLocaleString()}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        <div className="rounded-lg border border-orange-200 px-3 py-2">
                          <p className="text-gray-500">Base price</p>
                          <p className="font-bold text-gray-900">{formatMoney(auction.start_price || auction.fixed_price)}</p>
                        </div>
                        <div className="rounded-lg border border-orange-200 px-3 py-2">
                          <p className="text-gray-500">Current highest</p>
                          <p className="font-bold text-gray-900">{formatMoney(auction.current_price)}</p>
                        </div>
                        <div className="rounded-lg border border-orange-200 px-3 py-2">
                          <p className="text-gray-500">Interested buyers</p>
                          <p className="font-bold text-gray-900">{auction.interested_count}</p>
                        </div>
                        <div className="rounded-lg border border-orange-200 px-3 py-2">
                          <p className="text-gray-500">Total bids</p>
                          <p className="font-bold text-gray-900">{auction.bid_count}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Bid ranking (high to low)</h4>
                        {auction.topBids.length === 0 ? (
                          <p className="text-sm text-gray-500">No bids yet. Be the first when auction goes live.</p>
                        ) : (
                          <ul className="space-y-2 max-h-36 overflow-auto pr-1">
                            {auction.topBids.map((bid, idx) => (
                              <li
                                key={`${bid.bidder_id}-${bid.bid_time || "offer"}`}
                                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                              >
                                <span className="text-sm text-gray-700">
                                  #{idx + 1} {bid.username}
                                </span>
                                <span className="font-bold text-gray-900">{formatMoney(bid.bid_amount)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="mt-4 border-t border-orange-100 pt-4">
                        {auction.isSeller && auction.clock.phase === "upcoming" && (
                          <p className="text-sm text-amber-700 font-medium mb-2">
                            Seller view: countdown is visible until your auction starts.
                          </p>
                        )}

                        {!auction.isSeller && auction.is_interested !== 1 && (
                          <p className="text-sm text-gray-600 mb-2">
                            Only interested buyers can place bids once the auction starts.
                          </p>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="number"
                            min={Math.max(Number(auction.start_price), Number(auction.current_price) + 1)}
                            value={bidAmountByAuction[auction.auction_id] || ""}
                            onChange={(e) =>
                              setBidAmountByAuction((prev) => ({
                                ...prev,
                                [auction.auction_id]: e.target.value,
                              }))
                            }
                            placeholder={`Min ${formatMoney(Math.max(Number(auction.start_price), Number(auction.current_price) + 1))}`}
                            className="flex-1 rounded-lg border border-orange-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                            disabled={!auction.canBid || placingBidFor === auction.auction_id}
                          />
                          <button
                            onClick={() => placeBid(auction)}
                            disabled={!auction.canBid || placingBidFor === auction.auction_id}
                            className="rounded-lg px-4 py-2 font-bold text-white bg-gradient-to-r from-orange-500 to-rose-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                          >
                            {placingBidFor === auction.auction_id ? "Placing..." : "Place Bid"}
                          </button>
                        </div>

                        {auction.clock.phase === "live" && auction.canBid && (
                          <p className="text-xs text-orange-700 mt-2">
                            Next valid bid must be greater than {formatMoney(Number(auction.current_price))}. Equal or lower bids are rejected.
                          </p>
                        )}

                        {auction.clock.phase === "upcoming" && (
                          <p className="text-xs text-gray-500 mt-2">
                            Auction has not started yet. Seller and interested buyers will receive start notifications.
                          </p>
                        )}

                        {auction.clock.phase === "ended" && (
                          <p className="text-xs text-gray-500 mt-2">
                            Auction ended. The highest offer wins, the seller is notified of the buyer, and other participants receive a rejection notification.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
