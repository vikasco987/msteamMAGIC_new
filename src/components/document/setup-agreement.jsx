"use client";
import { getAmount } from "@/constants/agreement";
import { Document, Page, Text, View, Image, Font } from "@react-pdf/renderer";
import Html from "react-pdf-html";
import { styles } from "./styles";

Font.register({
  family: "Poppins",
  fonts: [
    { src: "/fonts/Poppins-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Poppins-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Poppins-SemiBold.ttf", fontWeight: 600 },
    { src: "/fonts/Poppins-Bold.ttf", fontWeight: 700 },
  ],
});

function CommonHeader({ date, company, client }) {
  return (
    <View style={styles.headerContainer} fixed>
      <View style={styles.stripTop} />
      <View style={styles.headerRow}>
        <Image src={company.logo} style={styles.logo} />
        <View style={styles.companyInfo}><Text>{company.phone}</Text><Text>{company.website}</Text></View>
      </View>
      <View style={styles.headerBottomRow}>
        <Text><Text style={styles.blackBold}>To </Text><Text style={styles.blueBold}>{client?.name?.toUpperCase()}</Text></Text>
        <Text style={styles.blackBold}>{date}</Text>
      </View>
    </View>
  );
}

function CommonFooter() {
  return (
    <View style={styles.footer} fixed>
      <Image src="/assets/footer-wave.png" style={styles.footerWave} />
    </View>
  );
}

export default function SetupAgreementPDF({ company, client, agreement, customHtml }) {
  if (!company || !client || !agreement) return null;

  return (
    <Document title="Setup Agreement" author={company.name} creator="Magic Scale">
      <Page size="A4" style={styles.page}>
        <CommonHeader date={agreement.date} company={company} client={client} />
        
        <View style={styles.content}>
          {customHtml && (
            <Html
              stylesheet={{
                p: { ...styles.paragraph, marginBottom: 8 },
                h3: { ...styles.sectionHeading, marginTop: 12, marginBottom: 8 },
                li: { ...styles.paragraph, marginBottom: 4 },
                strong: { ...styles.blackBold },
              }}
            >
              {customHtml}
            </Html>
          )}

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 40, paddingTop: 20 }} wrap={false}>
            <View style={{ width: "50%" }}>
              <Text style={styles.blackBold}>{company.name}</Text>
              <Text style={[styles.blackBold, { marginTop: 4 }]}>{company.designation}</Text>
              <Text style={styles.blueBold}>{company.representative}</Text>
              <Image src="/assets/signature.png" style={{ width: 120, height: 60, objectFit: "contain" }} />
            </View>
            <View style={{ width: "45%", textAlign: "right" }}>
              <Text style={styles.blackBold}>{client.name?.toUpperCase()}</Text>
              <Text style={styles.blueBold}>{client.representative}</Text>
            </View>
          </View>
        </View>
        <CommonFooter />
      </Page>
    </Document>
  );
}
