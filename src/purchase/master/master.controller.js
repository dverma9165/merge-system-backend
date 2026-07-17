const { prisma } = require('../../config/db');

const uniqueSorted = (values) =>
  Array.from(
    new Set(
      values
        .filter((v) => v && String(v).trim() !== '')
        .map((v) => String(v).trim())
    )
  ).sort();

// @desc    All Master rows (Settings > Master Table Entry vendors/transporters lists)
// @route   GET /api/purchase/master
// @access  Public
const listMasterRows = async (req, res, next) => {
  try {
    const rows = await prisma.purchaseMaster.findMany({ orderBy: { id: 'asc' } });
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    All tolerance-limit rows (Settings > Master Table Entry raw materials list)
// @route   GET /api/purchase/master/tolerance
// @access  Public
const listToleranceRows = async (req, res, next) => {
  try {
    const rows = await prisma.purchaseToleranceLimit.findMany({ orderBy: { id: 'asc' } });
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Distinct firm names from purchase_master's "Firm Name" column
// @route   GET /api/purchase/master/firms
// @access  Public
const getMasterFirmNames = async (req, res, next) => {
  try {
    const rows = await prisma.purchaseMaster.findMany({
      where: { firmName: { not: null } },
      select: { firmName: true },
      distinct: ['firmName'],
    });

    res.json({ success: true, data: uniqueSorted(rows.map((r) => r.firmName)) });
  } catch (error) {
    next(error);
  }
};

// @desc    All dropdown option lists + firm->generatedBy mapping IndentForm needs
// @route   GET /api/purchase/master/indent-options
// @access  Public
const getIndentOptions = async (req, res, next) => {
  try {
    const rows = await prisma.purchaseMaster.findMany({ orderBy: { id: 'asc' } });

    const firmNameMapping = {};
    rows.forEach((row) => {
      const firm = row.firmName?.trim();
      const genBy = row.generatedBy?.trim();
      if (firm && genBy) {
        firmNameMapping[firm] = genBy;
      }
    });

    res.json({
      success: true,
      data: {
        generatedByOptions: uniqueSorted(rows.map((r) => r.generatedBy)),
        vendorOptions: uniqueSorted(rows.map((r) => r.vendorName)),
        materialOptions: uniqueSorted(rows.map((r) => r.rawMaterialName)),
        indentTypeOptions: uniqueSorted(rows.map((r) => r.typeOfIndent)),
        uomOptions: uniqueSorted(rows.map((r) => r.uom)),
        firmNameOptions: uniqueSorted(rows.map((r) => r.firmName)),
        firmNameMapping,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a Master entry (Vendor Name / Transporter / Raw Material)
// @route   POST /api/purchase/master
// @access  Private
const createMasterEntry = async (req, res, next) => {
  try {
    const {
      type, vendorName, transporterName, rawMaterialName,
      aluminaRange, ironRange, apRange, bdRange,
    } = req.body;

    if (!type) {
      res.status(400);
      throw new Error('Please select a valid type.');
    }

    if (type === 'Vendor Name') {
      const entry = await prisma.purchaseMaster.create({
        data: { vendorName: vendorName?.trim() || null },
      });
      return res.status(201).json({ success: true, data: entry });
    }

    if (type === 'Transporter') {
      const entry = await prisma.purchaseMaster.create({
        data: {
          transporterName: transporterName?.trim() || null,
          typeOfKycForm: 'Transportation',
        },
      });
      return res.status(201).json({ success: true, data: entry });
    }

    if (type === 'Raw Material') {
      const name = rawMaterialName?.trim() || null;
      const [tl, master] = await prisma.$transaction([
        prisma.purchaseToleranceLimit.create({
          data: {
            name,
            tlAlumina: aluminaRange ? parseFloat(aluminaRange) : null,
            tlIron: ironRange ? parseFloat(ironRange) : null,
            apPercent: apRange ? parseFloat(apRange) : null,
            bdPercent: bdRange ? parseFloat(bdRange) : null,
          },
        }),
        prisma.purchaseMaster.create({
          data: {
            rawMaterialName: name,
            typeOfKycForm: 'Product',
            productName: name,
          },
        }),
      ]);
      return res.status(201).json({ success: true, data: { tl, master } });
    }

    res.status(400);
    throw new Error('Invalid type.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listMasterRows,
  listToleranceRows,
  getMasterFirmNames,
  getIndentOptions,
  createMasterEntry,
};
