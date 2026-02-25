export function statusBadge(status) {
  if (status === "active") {
    return {
      label: "Active",
      classes: "bg-success/10 text-success border border-success/20",
      dot: "bg-success",
    };
  }

  if (status === "expired") {
    return {
      label: "Expired",
      classes: "bg-error/10 text-error border border-error/20",
      dot: "bg-error",
    };
  }

  if (status === "limit_reached") {
    return {
      label: "Limit Reached",
      classes: "bg-warning/10 text-warning border border-warning/20",
      dot: "bg-warning",
    };
  }

  return {
    label: status,
    classes: "bg-base-200 text-base-content border border-base-300",
    dot: "bg-base-300",
  };
}
