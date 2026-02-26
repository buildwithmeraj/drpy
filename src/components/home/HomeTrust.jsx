import { FaShield } from "react-icons/fa6";
import { SiGoogletasks } from "react-icons/si";
import { BsShieldFillCheck } from "react-icons/bs";
import { MdOutlineTaskAlt } from "react-icons/md";

export default function HomeTrust() {
  return (
    <section className="grid lg:grid-cols-2 gap-4">
      <article className="surface-card p-6 reveal">
        <h3 className="text-2xl font-bold">Security and Abuse Controls</h3>
        <div className="flex gap-2 flex-row">
          <ul className="mt-4 space-y-2 text-sm opacity-90 flex-1">
            <li>
              <BsShieldFillCheck
                className="inline mr-1 text-info mb-0.5"
                size={16}
              />
              Policy-based upload size and file-type validation.
            </li>
            <li>
              <BsShieldFillCheck
                className="inline mr-1 text-info mb-0.5"
                size={16}
              />
              CSRF checks on state-changing endpoints.
            </li>
            <li>
              <BsShieldFillCheck
                className="inline mr-1 text-info mb-0.5"
                size={16}
              />
              Password-protected link access with secure hashing.
            </li>
            <li>
              <BsShieldFillCheck
                className="inline mr-1 text-info mb-0.5"
                size={16}
              />
              Security headers for browser hardening.
            </li>
          </ul>
          <FaShield className="text-primary/30 hidden md:flex" size={100} />
        </div>
      </article>

      <article className="surface-card p-6 reveal">
        <h3 className="text-2xl font-bold">Retention Policy</h3>
        <div className="flex gap-2 flex-row">
          <ul className="mt-4 text-sm opacity-90 flex-1">
            <li>
              <MdOutlineTaskAlt
                className="inline mr-1 text-info mb-0.5"
                size={18}
              />
              Expired and limit-reached links are cleaned automatically.
            </li>
            <li>
              <MdOutlineTaskAlt
                className="inline mr-1 text-info mb-0.5"
                size={18}
              />
              Files are retained by default so you can re-share quickly
            </li>
            <li>
              <MdOutlineTaskAlt
                className="inline mr-1 text-info mb-0.5"
                size={18}
              />
              Optional orphan cleanup can be enabled with retention days
            </li>
          </ul>
          <SiGoogletasks
            className="text-primary/30 hidden md:flex"
            size={100}
          />
        </div>
      </article>
    </section>
  );
}
