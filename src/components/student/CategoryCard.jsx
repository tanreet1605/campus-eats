function CategoryCard({ icon, name, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[82px] flex-col items-center gap-2 rounded-2xl p-3 shadow-sm transition ${
        selected
          ? "bg-orange-500 text-white"
          : "bg-white text-gray-700 hover:shadow-md"
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
          selected
            ? "bg-white/20"
            : "bg-orange-50"
        }`}
      >
        {icon}
      </div>

      <span className="text-xs font-medium">
        {name}
      </span>
    </button>
  );
}

export default CategoryCard;  