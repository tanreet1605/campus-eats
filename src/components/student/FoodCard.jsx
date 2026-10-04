function FoodCard({
  image,
  name,
  price,
  rating,
  time,
  available = true,
  onViewDetails,
  onAddToCart,
  addingToCart = false,
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
    >
      {/* Food Image */}
      <button
        type="button"
        onClick={onViewDetails}
        className="relative block h-40 w-full overflow-hidden bg-gray-100"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            🍽️
          </div>
        )}

        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
              Sold Out
            </span>
          </div>
        )}
      </button>

      {/* Food Details */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={onViewDetails}
            className="text-left"
          >
            <h3 className="font-semibold text-gray-900">
              {name}
            </h3>
          </button>

          <span className="whitespace-nowrap font-bold text-gray-900">
            ₹{price}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
          <span>⭐ {rating || "New"}</span>

          <span>•</span>

          <span>{time || "--"} min</span>
        </div>

        {/* Quick Add to Cart */}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!available || addingToCart}
          className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {!available
            ? "Unavailable"
            : addingToCart
            ? "Adding..."
            : "🛒 Add to Cart"}
        </button>

        {/* View Details */}
        <button
          type="button"
          onClick={onViewDetails}
          disabled={!available}
          className="mt-2 w-full rounded-xl border border-orange-500 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

export default FoodCard;