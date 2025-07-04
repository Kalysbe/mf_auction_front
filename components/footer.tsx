"use client"

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/lib/i18n/context"
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export function Footer() {
  const { language, t } = useLanguage()

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Логотип и описание */}
          <div>
            <Link href={language === "ru" ? "/" : "/en"} className="inline-block mb-4">
              <Image src="/logo.png" alt="ADB Solution" width={150} height={40} className="h-10 w-auto" />
            </Link>
            <p className="text-gray-400 mb-4">{t("footer.description")}</p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#cdb32f]"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#cdb32f]"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#cdb32f]"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#cdb32f]"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Навигация */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("footer.navigation")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={language === "ru" ? "/" : "/en"}
                  className="text-gray-400 hover:text-[#cdb32f] transition-colors"
                >
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link
                  href={language === "ru" ? "/about" : "/en/about"}
                  className="text-gray-400 hover:text-[#cdb32f] transition-colors"
                >
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link
                  href={language === "ru" ? "/services" : "/en/services"}
                  className="text-gray-400 hover:text-[#cdb32f] transition-colors"
                >
                  {t("nav.services")}
                </Link>
              </li>
              <li>
                <Link
                  href={language === "ru" ? "/news" : "/en/news"}
                  className="text-gray-400 hover:text-[#cdb32f] transition-colors"
                >
                  {t("nav.news")}
                </Link>
              </li>
              <li>
                <Link
                  href={language === "ru" ? "/contacts" : "/en/contacts"}
                  className="text-gray-400 hover:text-[#cdb32f] transition-colors"
                >
                  {t("nav.contacts")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Услуги */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("footer.services")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={language === "ru" ? "/services/audit" : "/en/services/audit"}
                  className="text-gray-400 hover:text-[#cdb32f] transition-colors"
                >
                  {t("services.audit")}
                </Link>
              </li>
              <li>
                <Link
                  href={language === "ru" ? "/services/accounting" : "/en/services/accounting"}
                  className="text-gray-400 hover:text-[#cdb32f] transition-colors"
                >
                  {t("services.accounting")}
                </Link>
              </li>
              <li>
                <Link
                  href={language === "ru" ? "/services/tax-consulting" : "/en/services/tax-consulting"}
                  className="text-gray-400 hover:text-[#cdb32f] transition-colors"
                >
                  {t("services.taxConsulting")}
                </Link>
              </li>
              <li>
                <Link
                  href={language === "ru" ? "/services/business-consulting" : "/en/services/business-consulting"}
                  className="text-gray-400 hover:text-[#cdb32f] transition-colors"
                >
                  {t("services.businessConsulting")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("footer.contacts")}</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="mr-2 h-5 w-5 text-[#cdb32f] flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">Разакова 32, Бишкек, Кыргызстан</span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 h-5 w-5 text-[#cdb32f] flex-shrink-0" />
                <a href="tel:+996555751592" className="text-gray-400 hover:text-[#cdb32f]">
                  +996 (555) 751-592
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 h-5 w-5 text-[#cdb32f] flex-shrink-0" />
                <a href="mailto:gulzada@adb-solution.com" className="text-gray-400 hover:text-[#cdb32f]">
                  gulzada@adb-solution.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>
            &copy; {currentYear} ADB Solution. {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  )
}
